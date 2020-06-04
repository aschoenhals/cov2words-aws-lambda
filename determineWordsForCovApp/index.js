var querystring = require('querystring');
var http = require('http');
var fn = require('./evaluate')

exports.handler = function (event, context, callback) {
    var post_data = querystring.stringify(event.body);
    var data = JSON.stringify(event);
    console.log(data);

    var patientData = JSON.parse(data);

    var answers = patientData.Details.ContactData.Attributes;
    var phoneNumber = patientData.Details.ContactData.CustomerEndpoint.Address;
    var serviceNumber = patientData.Details.ContactData.SystemEndpoint.Address;
    var languageCode = phoneNumber.startsWith("+49") ? "de" : "en";


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

    var xmlPayload = fn.generateXMLPayload(answers, languageCode);
   
    //console.log(answers.scoreMap);
   //console.log(fn.answersToRecommendation(answers, answers.scoreMap));
    
    
    var payload = {};
    if (languageCode === 'de') { // old
        payload = {
            "answer": "<PATIENT><A>" + age + "</A><B>" + answers.accommodation + "</B><C>" + answers.working_field + "</C><D>" + answers.smoker
                + "</D><Q>" + answers.contact_confirmed + "</Q><T>" + answers.fever_last_24h + "</T><U>" + answers.fever_last_4d + "</U><W>" + answers.chills
                + "</W><X>" + answers.weak + "</X><Y>" + answers.limb_pain + "</Y><Z>" + answers.cough + "</Z><A0>" + answers.snuff
                + "</A0><A1>" + answers.diarrhoea + "</A1><A2>" + answers.sore_throat + "</A2><A3>" + answers.head_ache + "</A3><B7>" + answers.breathlessness
                + "</B7><B9>00000000</B9><A5>" + answers.pneumonia + "</A5><A6>" + answers.diabetes + "</A6><A7>" + answers.heart_disease
                + "</A7><A8>" + answers.adipositas + "</A8><A9>" + answers.pregnant + "</A9></PATIENT>",
            "language": languageCode
        }
        console.log(payload);
    } else {
        payload = xmlPayload;
    }

    //console.log(JSON.stringify(answers));

    var post_options = {
        host: 'api.cov2words.com', // TODO
        path: '/api/pair/create', // TODO
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(JSON.stringify(payload)),
            'Authorization': 'Basic Y292MndvcmRzOmNvdjJ0ZXN0'
        }
    };

    //console.log('post_options' + JSON.stringify(post_options));
    
    var recommendationTerm ="";
    if(phoneNumber.startsWith("+1")) // usa
        recommendationTerm = "Please contact your local health department or call a local public hotline to learn how to corona virus testing is organized in your area."
    else if(phoneNumber.startsWith("+49")) // german
        recommendationTerm = answersToRecommendation(answers);
    else if(phoneNumber.startsWith("+45")) { // denmark
        recommendationTerm = "8-16 på hverdage ring til egen læge. 16-8 om morgenen på hverdage og i hele døgnet i weekender og helligdage, ring til lægevagten 70 11 31 31.";
    }


    var post_req = http.request(post_options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            //console.log('Response: ' + chunk);

            var responseObject = JSON.parse(chunk);
            //console.log(responseObject);
            var data = responseObject.data;
            var words = data.words;
            //console.log(words);
            var word1 = serviceNumber.startsWith("+1") ? JSON.parse(JSON.stringify(words.filter(function (element) { return element.order == 0; })))[0].word : JSON.parse(JSON.stringify(words.filter(function (element) { return element.order == 0; })))[0].word;
            var word2 = serviceNumber.startsWith("+1") ? JSON.parse(JSON.stringify(words.filter(function (element) { return element.order == 1; })))[0].word : JSON.parse(JSON.stringify(words.filter(function (element) { return element.order == 1; })))[0].word;
            var recommendation = recommendationTerm
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



