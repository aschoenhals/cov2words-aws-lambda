var querystring = require('querystring');
var http = require('http');
var AWS = require('aws-sdk');
AWS.config.region = 'eu-central-1';
var lambda = new AWS.Lambda();


exports.handler = function (event, context, callback) {
    var post_data = querystring.stringify(event.body);
    var data = JSON.stringify(event);
    console.log(data);
    
    var patientData = JSON.parse(data);
    
    var answers = patientData.Details.ContactData.Attributes; 
    var phoneNumber = patientData.Details.ContactData.CustomerEndpoint.Address;
    
    
    console.log(JSON.stringify(answers));
    
    
    var post_options = {
        host: 'us-central1-wirvsvirus-pwa.cloudfunctions.net', // TODO
        path: '/wordsFromJSON', // TODO
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(JSON.stringify(answers))
        }
    };
    
    console.log('post_options'+JSON.stringify(post_options));
    
    
    var post_req = http.request(post_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
            
            var responseObject = JSON.parse(chunk);
            var resultMap = {
                recommendation: responseObject.recommendation,
                word1: responseObject.word1,
                word2: responseObject.word2,
                word3: responseObject.word3
            }
           
            callback(null, resultMap);
            
            context.succeed();
        });
        res.on('error', function (e) {
            console.log("Got error: " + e.message);
            context.done(null, 'FAILURE');
        });
        
    });
    
    
    console.log('post_req'+JSON.stringify(post_req));
    
    post_req.write(JSON.stringify(answers));//TODO post_data
    post_req.end();
    
}