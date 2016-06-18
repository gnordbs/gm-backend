var express = require('express');
var passport = require('passport');
var async = require('async');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var Test = require(libs + 'model/test');
var Question = require(libs + 'model/question');
var UserAnswer = require(libs + 'model/userAnswer');
var AccessToken = require(libs + 'model/accessToken');
var User = require(libs + 'model/user');
var outData = require(libs + 'handle/data');
var util = require('util');


router.get('/', authenticateUser,  function(req, res) {
//router.get('/', passport.authenticate('bearer', { session: false }),  function(req, res) {
	
	Test.find({}, function (err, allTests) {
			
		if(!allTests) {
			res.statusCode = 404;
			res.end();
		} else if (!err) {
			
			var allTestsPublic = allTests.filter(function(item) {
				return testIsPublicCheck(item);
			});
	
			return res.json(outData.testlistToJson(allTestsPublic));
		} else {
			res.statusCode = 500;
			res.end();
			log.error('Internal error(%d): %s',res.statusCode,err.message);
		}
	});
});

router.get('/:id', authenticateUser, function(req, res) {
//router.get('/:id', passport.authenticate('bearer', { session: false }), function(req, res) {
	//console.log('---------------------------tests get id called');
	var tHead = req.get("Authorization");
	if(tHead.indexOf("Bearer") === 0){
		token = tHead.slice(7);	
	}
	
	Test.findById(req.params.id, function (err, oneTest) {
		
		if(!oneTest) {
			res.statusCode = 404;
			res.end();
		} else if (!err) {		
		
			getUserData(token, function(err, userData){
				if(!userData) {
					res.statusCode = 404;
					res.end();
				} else if (!err) {	
				
					isTestAlreadySubmited(oneTest.id, userData.id, function(err, userAnswer){
						if(err){
							res.statusCode = 500;
							res.end();
							log.error('Internal error(%d): %s',res.statusCode,err.message);		
						} else if(userAnswer) {
							
							getAnsweredTestForUser(oneTest, userAnswer, function(err, data){
								// send answered test to user
								if(err){
									res.statusCode = 500;
									res.end();	
								} else if(data){
									return res.json(data);	
								}								
							});
						} else {
							
							getNewTestForUser(oneTest, function(err, result){
								if(err){
									res.statusCode = 500;
									res.end();	
								} else if(result){
									return res.json(result);	
								}
							});
						}	
					});	
				} else {
					res.statusCode = 500;
					res.end();
					log.error('Internal error(%d): %s',res.statusCode,err.message);	
				}
			});
		} else {
			res.statusCode = 500;
			res.end();
			log.error('Internal error(%d): %s',res.statusCode,err.message);
		}
	});
});





router.post('/', authenticateUser, function(req, res) {
//router.post('/', passport.authenticate('bearer', { session: false }), function(req, res) {
	//console.log('---------------------------tests post called');
		
	var tHead = req.get("Authorization");
	if(tHead.indexOf("Bearer") === 0){
		token = tHead.slice(7);	
	}
		
	getUserData(token, function(err, userData){
		if(!userData) {
			res.statusCode = 404;
			res.end();
		} else if (!err) {
			// save test results
			//console.log(userData);	
			
			var attributes = req.body.data;

			verifyPostedTest(attributes, function(status){
				if(status === 'ok'){		
					var newUserAnswer = new UserAnswer({ 
						"testId": attributes.id,
						"userId": userData.id,
						"name": userData.firstName,
						"surname": userData.lastName,
						"phone": userData.phone,
						"email": userData.email,
						"rating": "",
						"answers": [],
					});
									
					var rawAnswers =  attributes['questions'];
					var ratio = 0;
					
					async.forEachOf(rawAnswers,
					function(item, answerIndex, callback){
						Question.findById(item.id, function (err, savedQuestion) {
							
							if(!savedQuestion) {
								res.statusCode = 404;
								res.end();
							} else if (!err) {
									
								var isCorrect = true;
								switch (savedQuestion.type){	
									case "text":
									
										var isCorrect = false;
										if(savedQuestion.textAnswer === item.textAnswer){
											isCorrect = true;
											ratio++;
										}
										
									break;
									case "radio":
									
									var isCorrect = true;
										savedQuestion.allAnswers.forEach(function(savedAnswer, index){
											if(item.allAnswers[index]){
												if(savedAnswer.isDefault !== item.allAnswers[index].isDefault){
													isCorrect = false;	
												}	
											} else {
												isCorrect = false;	
											}	
										});
										
										if(isCorrect) ratio++;
										
									break;
									case "checkbox":
									
									var isCorrect = true;
										savedQuestion.allAnswers.forEach(function(savedAnswer, index){
											if(item.allAnswers[index]){
												if(savedAnswer.isTrue !== item.allAnswers[index].isTrue){
													isCorrect = false;	
												}	
											} else {
												isCorrect = false;	
											}
										});
										
										if(isCorrect) ratio++;
									break;
								}
								
								newUserAnswer.answers.push({
									"qId": savedQuestion.id,
									"isCorrect": isCorrect,
									"shortId": 'q_'+answerIndex
								});
								/*newUserAnswer.answers.push({
									"qId":'q_'+answerIndex,
									"isCorrect": isCorrect
								});*/
								callback();
								
							} else {
								res.statusCode = 500;
								res.end();
								log.error('Internal error(%d): %s',res.statusCode,err.message);
							}
						});
					},
					function(err){
						if (!err) {
							newUserAnswer.rating = ratio + '/' + rawAnswers.length;
							newUserAnswer.save(function (err,savedUserAnswer) {
								if (!err) {	
									res.statusCode = 200;
									res.end();			
								} else {
									if(err.name === 'ValidationError') {
										res.statusCode = 400;
										res.end();
									} else {
										res.statusCode = 500;
										res.end();
									}
									log.error('Internal error(%d): %s', res.statusCode, err.message);
								}
							});	
						} else {
							res.statusCode = 500;
							res.end();
							log.error('Internal error(%d): %s',res.statusCode,err.message);
						}
					}
					);
				} else {
					res.status(400).send({ error: status});
				}
			});
			
		} else {
			res.statusCode = 500;
			res.end();
			log.error('Internal error(%d): %s',res.statusCode,err.message);
		}	
	});	
});

function getUserData(accessToken, callback) {
	AccessToken.findOne({ token: accessToken }, function(err, token) {
		if (err) { 
			callback(err); 
		} else if (!token) { 
			callback("token not found", null); 
		}

		User.findById(token.userId, function(err, user) {
			if (err) { 
				callback(err); 
			} else if (!user) { 
				callback("user not found", null); 
			}

			callback(null, user);
		});
	});
};

function getNewTestForUser(oneTest, cback){
		
	var availavilityText = testTimingCheck(oneTest);
	if(availavilityText !== ""){
		
		oneTest.isAvailable = false;
		oneTest.availabilityText = availavilityText;
		oneTest.questions = [];
		
		cback(null, outData.testToJson(oneTest));
	} else {		
		
		async.map(oneTest.questions,
			function(item, callback){	
				getQuestionById(item, function(err, oneQuestion){
					if(!err && oneQuestion){
						callback(null, oneQuestion);	
					} else {
						callback(err);	
					}
				});					
			},
			function(err, results){
				if(err) {
					cback(err);
				}
				if(results){
					oneTest.questions = results;
					cback(null, outData.testToJson(oneTest));
				}
			}
		);
	}	
};

function getAnsweredTestForUser(oneTest, userAnswer, cback){
		
	var availavilityText = testTimingCheck(oneTest);
	if(availavilityText !== ""){
		
		oneTest.isAvailable = false;
		oneTest.availabilityText = availavilityText;
		oneTest.questions = [];
		
		cback(null, outData.testToJson(oneTest));
	} else {		
		
		async.map(oneTest.questions,
			function(item, callback){	
				getQuestionWithAnswersById(item, function(err, oneQuestion){
					if(!err && oneQuestion){				
						userAnswer.answers.forEach(function(userAnswer){
							if(userAnswer.qId === item){
								oneQuestion.unconfirmed = !userAnswer.isCorrect;
							}	
						});
						callback(null, oneQuestion);	
					} else {
						callback(err);	
					}
				});					
			},
			function(err, results){
				if(err) {
					cback(err);
				}
				if(results){
					oneTest.questions = results;
					var result = outData.testToJson(oneTest);
					result.isAnswered = true;	
					
					cback(null, result);
				}
			}
		);
	}	
};

function isTestAlreadySubmited(testId, userId, callback) {
	UserAnswer.findOne({'testId': testId, 'userId': userId}, function(err, oneUserAnswer) {
		if (err) { 
			callback(err, null); 
		} else if (oneUserAnswer) { 
			callback(null, oneUserAnswer); 
		} else{
			callback(null, null);	
		}
	});
};
	
function getQuestionById(questionId, callback){
	if (typeof(callback) == "function"){
			
		Question.findById(questionId, function (err, oneQuestion) {			
			if(!oneQuestion) {
				callback('Question not found: ', questionId);
			} else if (!err) {
				callback(err, outData.questionUserJson(oneQuestion));
			} else {
				callback(err);
			}
		});
	}
}

function getQuestionWithAnswersById(questionId, callback){
	if (typeof(callback) == "function"){
			
		Question.findById(questionId, function (err, oneQuestion) {			
			if(!oneQuestion) {
				callback('Question not found: ', questionId);
			} else if (!err) {
				callback(err, oneQuestion);
			} else {
				callback(err);
			}
		});
	}
}

function testTimingCheck(oneTest){
	var avText = "";
	var startDate =  oneTest.startDate || '';
	startDate.setHours(0, 0, 0, 0);
	var endDate =  oneTest.endDate || '';
	endDate.setHours(0, 0, 0, 0);
	
	var currentDate = new Date();
	currentDate.setHours(0, 0, 0, 0);	
	if(currentDate < startDate){
		var startDay = startDate.toDateString();
		avText = "This will be available on " + startDay;
		return avText;	
	} else if (currentDate <= endDate) {
		return avText;	
	} else {
		avText = "This test is already closed";
		return avText;	
	}
};

function testIsPublicCheck(oneTest){
	if(oneTest && oneTest.isPublic){
		return true;
	} else {
		return false;	
	}
};

function verifyPostedTest(newTest, callback){
	var status = "";
	
	if(newTest){
		/*	// user form moved to registration
		var userForm = newTest.userForm;
		// check if user form data is filled
		if(!(userForm.name && userForm.surname && userForm.phone && userForm.email)){
			status+= "User data is incorrect. ";
		} 	*/
		
		// check if all questions are correct
		var questionsVeryfy = true;
		newTest.questions.forEach(function(item){	
			if(!verifyQuestion(item)){
				questionsVeryfy = false;
			}
		});
		if(!questionsVeryfy){
			verified = false;
			status+= "Answers filled incorrectly. ";				
		}
		
		if(status === ""){
			status = 'ok';
		}
		
		if (typeof(callback) == "function"){
			callback(status);
		}	
			
	} else {
		if (typeof(callback) == "function"){
			callback('Test is empty');
		}
	}		
};
	
function verifyQuestion(question){
	var verified = true;

	if(question.type === "text") {// if type is text check that answer is present,
		if(!question.textAnswer){
			verified = false;	
		}
	} else {
		// check if correct answers chosen	
		if(!verifyAnswer(question)){
			verified = false;				
		}					
	}
	
	return verified;
};

function verifyAnswer (question){
	var answersChosen = false;
	if(question.type === "radio"){
		question.allAnswers.forEach(function(item){
			if(item.isDefault){
				
				answersChosen = true;	
			}	
		});	
	} else if(question.type === "checkbox"){
		question.allAnswers.forEach(function(item){
			if(item.isTrue){
				answersChosen = true;	
			}	
		});	
	}
	
	return answersChosen;
};

function authenticateUser(req, res, next){
	passport.authenticate('bearer', { session: false }, function(err, user, info) {	
		if (err) { 
			res.set('WWW-Authenticate', err);
			res.statusCode = 401;
			res.json(err);	
		} else if (!user) {	
			var error = getErrObjectFromInfo(info);
			res.set('WWW-Authenticate', info);
			res.statusCode = 401;
			res.json(error);	
		} else {
			next();	
		}
	})(req, res);	
};

function getErrObjectFromInfo(info){
	if(info){
		var data = info.split(',');
		var error = {};
		
		data.forEach(function(item){	
				if(item.indexOf("error_description") > -1){		
				error.error_description = item.substring(item.indexOf('"')+1,item.lastIndexOf('"'));	
			} else if(item.indexOf("error") > -1){
				error.error = item.substring(item.indexOf('"')+1,item.lastIndexOf('"'));	
			}
		});	
		return error;
	} else {
		return "";	
	}
};


module.exports = router;