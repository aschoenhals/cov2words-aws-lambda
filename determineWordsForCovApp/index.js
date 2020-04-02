var querystring = require('querystring');
var http = require('http');
var AWS = require('aws-sdk');
AWS.config.region = 'eu-central-1';


exports.handler = function (event, context, callback) {
    var post_data = querystring.stringify(event.body);
    var data = JSON.stringify(event);
    console.log(data);

    var patientData = JSON.parse(data);

    var answers = patientData.Details.ContactData.Attributes;
    var phoneNumber = patientData.Details.ContactData.CustomerEndpoint.Address;
    var serviceNumber = patientData.Details.ContactData.SystemEndpoint.Address;
    var languageCode = serviceNumber.startsWith("+1") ? "en" : "de";


    var age = answers.age;
    if (age < 40) {
        age = 0;
    } else if (age < 50) {
        age = 1;
    } else if (age < 60) {
        age = 2;
    } else if (age < 70) {
        age = 3;
    } else if (age < 80) {
        age = 4;
    } else {
        age = 5;
    }

    var payload = {};
    if (languageCode == 'de') {
        payload = {
            "answer": "<PATIENT><A>" + age + "</A><B>" + answers.accommodation + "</B><C>" + answers.working_field + "</C><D>" + answers.smoker
                + "</D><Q>" + answers.contact_confirmed + "</Q><T>" + answers.fever_last_24h + "</T><U>" + answers.fever_last_4d + "</U><W>" + answers.chills
                + "</W><X>" + answers.weak + "</X><Y>" + answers.limb_pain + "</Y><Z>" + answers.cough + "</Z><A0>" + answers.snuff
                + "</A0><A1>" + answers.diarrhoea + "</A1><A2>" + answers.sore_throat + "</A2><A3>" + answers.head_ache + "</A3><B7>" + answers.breathlessness
                + "</B7><B9>00000000</B9><A5>" + answers.pneumonia + "</A5><A6>" + answers.diabetes + "</A6><A7>" + answers.heart_disease
                + "</A7><A8>" + answers.adipositas + "</A8><A9>" + answers.pregnant + "</A9><B0>" + answers.cortisone + "</B0><B1>" + answers.cancer
                + "</B1><B2>" + answers.flu_vaccination + "</B2></PATIENT>",
            "language": languageCode
        }
    } else {
        payload = {
            "answer": "<PATIENT><V0>301</V0><P0>"+answers.personalInfo_P0+"</P0><P2>"+answers.personalInfo_P2+"</P2><P3>"+answers.personalInfo_P3
            +"</P3><P4>"+answers.personalInfo_P4+"</P4><P5>"+answers.personalInfo_P5+"</P5><P6>"+answers.personalInfo_P6+"</P6><C0>"+answers.contact_C0
            +"</C0><S0>"+answers.symptoms_S0+"</S0><S1>"+answers.symptoms_S1+"</S1><S3>"+symptoms_S3+"</S3><S4>"+answers.symptoms_S4
            +"</S4><S5>"+answers.symptoms_S5+"</S5><S6>"+answers.respiratorySymptoms_S6+"</S6><S7>"+answers.respiratorySymptoms_S7+"</S7><S8>"+answers.symptoms_S8
            +"</S8><S9>"+answers.symptoms_S9+"</S9><SA>"+answers.symptoms_SA+"</SA><SB>"+answers.respiratorySymptoms_SB+"</SB><SC>"+answers.symptoms_SC
            +"</SC><SZ>20200101</SZ><D0>"+answers.illnesses_D0+"</D0><D1>"+answers.illnesses_D1+"</D1><D2>"+answers.illnesses_D2
            +"</D2><D3>"+answers.illnesses_D3+"</D3><M0>"+answers.medication_M0+"</M0><M1>"+answers.medication_M1+"</M1><M2>"+answers.medication_M2+"</M2></PATIENT>",
            "language": languageCode
        }
    }

    console.log(JSON.stringify(answers));

    var post_options = {
        host: 'cov2words.hepp.io', // TODO
        path: '/api/pair/create', // TODO
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(JSON.stringify(payload)),
            'Authorization': 'Basic Y292MndvcmRzOmNvdjJ0ZXN0'
        }
    };

    console.log('post_options' + JSON.stringify(post_options));


    var post_req = http.request(post_options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);

            var responseObject = JSON.parse(chunk);
            console.log(responseObject);
            var data = responseObject.data;
            var words = data.words;
            console.log(words);
            var word1 = serviceNumber.startsWith("+1") ? JSON.parse(JSON.stringify(words.filter(function (element) { return element.order == 0; })))[0].word : JSON.parse(JSON.stringify(words.filter(function (element) { return element.order == 0; })))[0].word;
            var word2 = serviceNumber.startsWith("+1") ? JSON.parse(JSON.stringify(words.filter(function (element) { return element.order == 1; })))[0].word : JSON.parse(JSON.stringify(words.filter(function (element) { return element.order == 1; })))[0].word;
            var recommendation = serviceNumber.startsWith("+1") ? "Please contact your local health department or call a local public hotline to learn how to corona virus testing is organized in your area." : answersToRecommendation(answers);
            var resultMap = {
                recommendation: recommendation,
                word1: word1,
                word2: word2
            }
            callback(null, resultMap);

            context.succeed();
        });
        res.on('error', function (e) {
            console.log("Got error: " + e.message);
            context.done(null, 'FAILURE');
        });

    });


    console.log('post_req' + JSON.stringify(post_req));

    // post the data
    post_req.write(JSON.stringify(payload));//TODO post_data
    post_req.end();


}


function answersToRecommendation(req) {
    const messageError = 'Entschuldigung, etwas ist schief gelaufen. Probieren Sie es zu einem späteren Zeitpunkt erneut. Vielen Dank für Ihr Verständnis';
    console.log(req);
    const answers = req,
        answerKeys = Object.keys(answers);
    // General Recommendation Rules:
    // Risikogruppe, wenn eine der Diagnosen
    let riskGroupRecommendation = '';
    // Zum Arzt, wenn mehr als 3 Symptome
    let doctorRecommendation = '';
    // Zuhause bleiben, wenn mindestens 1 Symtpom oder wenn mit Verdachtsfall/Bestätigtem Fall in Kontakt gewesen
    let stayHomeRecommendation = '';
    console.info(JSON.stringify(answers));
    const isRiskGroup = [
        'pneumonia',
        'diabetes',
        'heart_disease',
        'adipositas',
        'pregnant',
        'cortison',
        'cancer'
    ].filter((el) => answers[el] == 0).length;
    console.log("risk " + isRiskGroup);
    riskGroupRecommendation = isRiskGroup > 0
        ? 'Sie scheinen zu der Risikogruppe zu gehören. '
        : 'Sie scheinen nicht zu der Risikogruppe zu gehören.';

    // mehr als 3 Symptom-Ja´s => zum Arzt geschickt (Husten, Fieber und Durchfall)
    const numberOfSymptoms = [
        'fever_last_24h',
        'fever_last_4d',
        'chills',
        'weak',
        'limb_pain',
        'cough',
        'snuff',
        'diarrhoea',
        'sore_throat',
        'head_ache',
        'heart_disease',
        'breathlessness'
    ].filter((el) => answers[el] == 0).length;
    console.log("number symptoms " + numberOfSymptoms);
    if (numberOfSymptoms >= 3) {
        doctorRecommendation = 'Es wäre gut, wenn Sie einen Arzt aufsuchen könnten, der Ihre Symptome weiter untersucht.';
        stayHomeRecommendation = 'Wir bitten Sie dringenst, ansonsten zunächst zuhause zu bleiben.';
    }
    // Weniger als 3 aber mindestens 1 Symptom
    else if (numberOfSymptoms > 0) {
        // zuhause bleiben und sich checken ob Symptome dazukommen/schlimmer werden
        doctorRecommendation = 'Sie müssen momentan keine ärztliche Beratung aufsuchen.';
        stayHomeRecommendation = 'Bleiben Sie bitte trotzdem zuhause und beobachten Sie ihre eigene Symptome. Sollten Ihr Zustand sich verschlechtern, wiederholen Sie bitte diesen Test.';
    } else {
        // 0 Symptome. Aber: wenn Kontakt mit Corona dude oder suspicion bleib zuhause
        doctorRecommendation = 'Sie müssen momentan keine ärztliche Beratung aufsuchen.';
        if (answers['contact_confirmed'] || answers['contact_suspicion']) {
            stayHomeRecommendation = 'Dennoch waren Sie vielleicht mit dem Virus in Kontakt. Wir bitten Sie dringenst, zunächst zuhause zu bleiben. Beobachten Sie sich selbst auf Symptome. Sollte Ihr Zustand sich verschlechtern, wiederholen Sie bitte diesen Test.';
        } else {
            stayHomeRecommendation = 'Sie können Ihrem Alltag mit den aufs Nötigste reduzierten sozialen Kontakten weiter nachgehen.';
        }
    }
    if (riskGroupRecommendation.length < 1 || doctorRecommendation.length < 1 || stayHomeRecommendation.length < 1) {
        return messageError;
    }
    return [riskGroupRecommendation, doctorRecommendation, stayHomeRecommendation].join(' ');
}



