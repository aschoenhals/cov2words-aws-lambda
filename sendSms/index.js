var AWS = require('aws-sdk');

// see https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/sns-examples-sending-sms.html
// see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SNS.html#publish-property
// see https://github.com/vaquarkhan/vaquarkhan/wiki/AWS-Lambda-send-SMS-message

  			/**
  			 * Entry function for this
  			 * Lambda.
  			 * 
  			 * This function delivers a message 
  			 * to a specific number.
  			 * 
  			 * First approach will only handle 
  			 * delivery type sms.
  			 */
  			exports.handler = (event, context, callback) => {
  				console.log(JSON.stringify(event));

  				if (event.type === undefined || event.type === null || event.type === '' || event.type.trim() === '') {
  					callback(get_response_message('Type of delivery is required.'), 412);
  					return;
  				}

  				if (event.type.trim() !== 'sms') {
  					callback(get_response_message('The available delivery type is \'sms\'.', 412));
  					return;
  				}

  				if (event.type.trim() === 'sms' && (event.target === '' || isNaN(event.target))) {
  					callback(get_response_message('The target must be a number.', 412));
  					return;
  				}

  				deliver(event.target, event.message, event.region, callback);
  			};

  			/**
  			 * This function delivers a
  			 * message to a specific number.
  			 * 
  			 * The function will create a topic
  			 * from scratch to avoid any
  			 * clash among subscriptions.
  			 * 
  			 * @param number in context.
  			 * @param message that will be sent.
  			 * @param region in context.
  			 * @param cb a callback function to 
  			 *           return a response to the 
  			 *           caller of this service.
  			 */
  			var deliver = (number, message, region, cb) => {
  			   var sns = new AWS.SNS({region: region});
  			   console.log(`${number} - ${region} - ${Date.now()}`);
  			   var params = { Name: `${number}_${region}_${Date.now()}` };

  			   sns.createTopic(params, function(err, tdata) {
  				 if (err) {
  					 console.log(err, err.stack);
  					 cb(get_response_message(err, 500));
  				 } else {
  					 console.log(tdata.TopicArn);
  					 sns.subscribe({
  					   Protocol: 'sms',
  					   TopicArn: tdata.TopicArn,
  					   Endpoint: number
  				   }, function(error, data) {
  						if (error) {
  							//Rollback to the previous created services.
  							console.log(error, error.stack);
  							params = { TopicArn: tdata.TopicArn};
  							sns.deleteTopic(params, function() { cb(get_response_message(error, 500)); });

  							return;
  						}

  						console.log('subscribe data', data);
  						var SubscriptionArn = data.SubscriptionArn;

  						params = { TargetArn: tdata.TopicArn, Message: message, Subject: 'CoVid Info' };
  						sns.setSMSAttributes ({attributes: {DefaultSenderID: 'CovidApp', 'DefaultSMSType': 'Transactional'}}, function (err_attr, data_attr) {
  						    if (err_attr) {
  						        console.log(err_attr, err_attr.stack);
  						    }
  					    sns.publish(params, function(err_publish, data) {
  						   if (err_publish) {
  								console.log(err_publish, err_publish.stack);
  								//Rollback to the previous created services.
  								params = { TopicArn: tdata.TopicArn};
  								sns.deleteTopic(params, function() {
  									params = {SubscriptionArn: SubscriptionArn};
  									sns.unsubscribe(params, function() { cb(get_response_message(err_publish, 500)); });
  								});

  								return;
  						   } else console.log('Sent message:', data.MessageId);

  						   params = { SubscriptionArn: SubscriptionArn };
  						   sns.unsubscribe(params, function(err, data) {
  							  if (err) console.log('err when unsubscribe', err);

  							  params = { TopicArn: tdata.TopicArn };
  							  sns.deleteTopic(params, function(rterr, rtdata) {
  								 if (rterr) {
  									console.log(rterr, rterr.stack);
  									cb(get_response_message(rterr, 500));
  								 } else {
  									console.log(rtdata);
  									cb(null, get_response_message('Message has been sent!', 200));
  								 }
  							  });
  						   });
  					   });	    
  						});
  					
  					 });
  				  }
  			   });
  			};

  			/**
  			 * This function returns the response
  			 * message that will be sent to the 
  			 * caller of this service.
  			 */
  			var get_response_message = (msg, status) => {
  			   if (status == 200) {
  				  return `{'status': ${status}, 'message': ${msg}}`;
  			   } else {
  				  return `${status} - ${msg}`;
  			   }
  			};