var http = require('http');
var fn = require('./evaluate');

exports.handler = function (event, context, callback) {

    var data = JSON.stringify(event);
    var patientData = JSON.parse(data);

    var { scoreMap, ...answers } = patientData.Details.ContactData.Attributes;
    var phoneNumber = patientData.Details.ContactData.CustomerEndpoint.Address;
    var serviceNumber = patientData.Details.ContactData.SystemEndpoint.Address;
    var languageCode = phoneNumber.startsWith("+49") ? "de" : "en";


    var xmlPayload = fn.generateXMLPayload(answers, languageCode);
    var recommendationTerm = fn.answersToStatements(answers, scoreMap);
    
    var payload = xmlPayload;

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


    var post_req = http.request(post_options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {

            var responseObject = JSON.parse(chunk);

            var data = responseObject.data;
            var words = data.words;

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