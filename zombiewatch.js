var fs = require("fs");
var spawn = require('child_process').spawnSync;
var resemble = require("node-resemble-js");
var DCDriver = require('dream-cheeky-driver');
var nforce = require('nforce'),
    chatter =require('nforce-chatter')(nforce);
var cloudsight = require ('cloudsight') ({
  apikey: 'APIKEY'
});
var request = require('request');

var org = nforce.createConnection({
  clientId: '3MVG9sG9Z3Q1RlbdgwDkzM3OQ0rbyEhv3U2zHLecnp1hMpmc.j.ng7mO.tlVC0ArPDeY.4JG0RlwfMPNONz4s',
  clientSecret: '1308854095208667500',
  redirectUri: 'imp://nothinghere',
  apiVersion: 'v32.0', 
  mode: 'single',
  plugins: ['chatter']
});

var _is_processing = false;
var created_case_id = null;

console.log('Logging into Salesforce');
org.authenticate({ username: 'USERNAME', password: 'PASSWORD'}, function(err, resp){
    var userid;
    if(!err) {
    	console.log(org.oauth);
    	userid = org.oauth.id.split("/")[5];
    	console.log(userid);
    } else {
    	console.log(err);
    	process.exit(0);
    }

    console.log('listening for actions');
    var str = org.stream('IOTActions', org.oauth);
	  str.on('connect', function(){
	    console.log('connected to pushtopic');
	  });

	  str.on('error', function(error) {
	    console.error('error: ' + error);
	  });

	  str.on('data', function(data) {
    	if(data.sobject.Message__c.toLowerCase().indexOf('kill') >= 0 ||
    		data.sobject.Message__c.toLowerCase().indexOf('shoot') >= 0 ||
    		 data.sobject.Message__c.toLowerCase().indexOf('murder') >= 0 ||
    		  data.sobject.Message__c.toLowerCase().indexOf('fire') >= 0 
    		) {
    			DCDriver.fire(1,console.log);
    			console.log("zombie down");
    			spawn('./takeupdate.sh');
    			request.post(
									    'https://api.pushover.net/1/messages.json',
									    { form: {
									      'token' : 'azmgshgwmubwwn98k2eoni3h531r1d',
									      'user': 'udN7jB72fuSivUa7T5LgEYTz9iotrF',
									      'message': "The object has been dealt with, see Salesforce for updated picture."
									  	  } 
									    },
									    function (error, response, body) {
									        if (!error && response.statusCode == 200) {
									            console.log(body)
									        }
									    }
									);
    			request.put(
									    'https://api.lifx.com/v1/lights/label:Study Above/state',
									    { form: {
											    "color": "green"
											},
										  headers: {
										  	"Authorization": "Bearer cb8c8dbb2b50db8e9518f6a767647793673aeb24f642051c642b00a630afba4e"
										  } 
									    },
									    function (error, response, body) {
									        if (!error && response.statusCode == 200) {
									            console.log(body)
									        }
									    }
									);

    			if(created_case_id != null) {			
	    		    var att = nforce.createSObject('Attachment', {
												    Name: 'Desk_Update.jpg',
												    Description: 'This is a snapshot of your desk',
												    ParentId: created_case_id,
												    attachment: {
												      fileName: 'Desk_Update.jpg',
												      body: fs.readFileSync('./update.jpg')
												    }
												  });

	    		    org.insert({ sobject: att, oauth: org.oauth }, function(att_err, att_resp) {
											    if(err) return console.error(err);
											    console.log('[OK] attached updated image!');
											    fs.unlinkSync('update.jpg');
											  });	
			    

	    		 request.put(
									    'https://api.lifx.com/v1/lights/label:Study Below/state',
									    { form: {
											    "power": "off"
											},
										  headers: {
										  	"Authorization": "Bearer cb8c8dbb2b50db8e9518f6a767647793673aeb24f642051c642b00a630afba4e"
										  } 
									    },
									    function (error, response, body) {
									        if (!error && response.statusCode == 200) {
									            console.log(body)
									        }
									        _is_processing = false;
									    }
									);   

			    }				
    		}
    	});
	


	spawn('./takebaseline.sh');
    console.log('starting loop');
	setInterval(function(){
	  if(!_is_processing) {
		  var pic1 = spawn('./takeupdate.sh');
		  if(pic1.error != null) {
				console.log(pic1.error); 
			}
		  resemble("./baseline.png")
				.compareTo("./update.png")
				.onComplete( function ( data ) {
					console.log(data.misMatchPercentage);
					if(data.misMatchPercentage > 50 && data.misMatchPercentage < 100) {
						console.log('object detected');
						_is_processing = true;
						var postid;
						
						
						//post the situation to Chatter
						org.chatter.postFeedItem({id: userid, text: 'An object has been detected on your desk.  More information coming.', oauth: org.oauth}, function(err, resp) {
			              if(!err) {
			              	postid = resp.id;

			              	var pic2 = spawn('./takeobjectpic.sh');
							var image = {
							  image: './object.jpg',
							  locale: 'en-US'
							};

							// Upload image to analyze, report results
							cloudsight.request (image, true, function(err,data) {
								console.log(data);
								if(err) {
									console.log(err);
									request.post(
									    'https://api.pushover.net/1/messages.json',
									    { form: {
									      'token' : 'azmgshgwmubwwn98k2eoni3h531r1d',
									      'user': 'udN7jB72fuSivUa7T5LgEYTz9iotrF',
									      'message': "Zombiewatch encountered an error."
									  	  } 
									    },
									    function (error, response, body) {
									        if (!error && response.statusCode == 200) {
									            console.log(body)
									        }
									    }
									);
									_is_processing = false;
								}
								else if(typeof data.name == 'undefined') {
									request.post(
									    'https://api.pushover.net/1/messages.json',
									    { form: {
									      'token' : 'azmgshgwmubwwn98k2eoni3h531r1d',
									      'user': 'udN7jB72fuSivUa7T5LgEYTz9iotrF',
									      'message': "Zombiewatch found nothing"
									  	  } 
									    },
									    function (error, response, body) {
									        if (!error && response.statusCode == 200) {
									            console.log(body)
									        }
									    }
									);
									_is_processing = false;
								}else if( data.name.indexOf('zombie') >= 0 || data.name.indexOf('man') >= 0 || data.name.indexOf('figur') ) {
									//DANGER
									request.put(
									    'https://api.lifx.com/v1/lights/label:Study Above/state',
									    { form: {
											    "color": "red"
											},
										  headers: {
										  	"Authorization": "Bearer cb8c8dbb2b50db8e9518f6a767647793673aeb24f642051c642b00a630afba4e"
										  } 
									    },
									    function (error, response, body) {
									        if (!error && response.statusCode == 200) {
									            console.log(body)
									        }
									    }
									);

									//alert zombiewatch
									request.post(
									    'https://api.pushover.net/1/messages.json',
									    { form: {
									      'token' : 'azmgshgwmubwwn98k2eoni3h531r1d',
									      'user': 'udN7jB72fuSivUa7T5LgEYTz9iotrF',
									      'message': "A \""+data.name+"\" has been detected on your desk. It may be dangerous. A Salesforce case has been created."
									  	  } 
									    },
									    function (error, response, body) {
									        if (!error && response.statusCode == 200) {
									            console.log(body)
									        }
									    }
									);


									var ncase = nforce.createSObject('Case', {
										Subject:'Dangerous object detected on your desk',
										Priority:'Medium',
										Status:'New',
										Description:'An object detected to be "'+data.name+'" has been found on your desk'
									});
									org.insert({ sobject: ncase, oauth: org.oauth}, function(case_err, case_resp) {
											
											console.log(case_resp);
											created_case_id = case_resp.id;
			              					//add image
											var att = nforce.createSObject('Attachment', {
											    Name: 'Desk_Snapshot.jpg',
											    Description: 'This is a snapshot of your desk',
											    ParentId: case_resp.id,
											    attachment: {
											      fileName: 'Desk_Snapshot.jpg',
											      body: fs.readFileSync('./object.jpg')
											    }
											  });

											org.insert({ sobject: att, oauth: org.oauth }, function(att_err, att_resp) {
											    if(err) return console.error(err);
											    console.log('[OK] attached image!');
											    fs.unlinkSync('object.jpg');
											  });
											
											//add image
											org.chatter.postComment({id: postid, text: 'The object is detected to be: '+data.name+'.  This object may be suspicious and a case ('+case_resp.id+') has been generated.', oauth: org.oauth}, function(err, resp) {
								              if(!err) {
							              	//	process.exit(0);  	
								              } else {
								                console.log(err);
								              }
								          	});

										});
			

									} else {

										org.chatter.postComment({id: postid, text: 'The object is detected to be: '+data.name+'.  The object appears safe.', oauth: org.oauth}, function(err, resp) {
								              if(!err) {
							              	//	process.exit(0);  	
								              } else {
								                console.log(err);
								              }
								          	});

									}
								});




			              } else {
			                console.log(err);
			              }
			          	});

						} 
					else if(data.misMatchPercentage >= 50) {
						console.log('image corruption detected, please wait')
					}
				});
		}
	}, 1500); 

});    




