var express = require('express'),
	passport = require('passport'),
	async = require('async'),
	router = express.Router(),
	fs = require('fs');

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var Test = require(libs + 'model/test');
var Question = require(libs + 'model/question');
var Statistics = require(libs + 'model/Statistics');
var TestImage = require(libs + 'model/image');
var outData = require(libs + 'handle/data');
var util = require('util');


router.get('/', authenticateAdmin,
	function(req, res) {
		Test.find({}, function (err, allTests) {
				
			if(!allTests) {
				res.statusCode = 404;
				res.end();
			} else if (!err) {
				return res.json(outData.testlistToJson(allTests));
			} else {
				res.statusCode = 500;
				res.end();
				log.error('Internal error(%d): %s',res.statusCode,err.message);
			}
		});
	}
);

router.get('/:id', authenticateAdmin, function(req, res) {
//router.get('/:id', passport.authenticate('bearer_admin', { session: false }), function(req, res) {
//router.get('/:id',  function(req, res) {
	Test.findById(req.params.id, function (err, oneTest) {
		if(!oneTest) {
			res.statusCode = 404;
			res.end();
		} else if (!err) {
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
						res.statusCode = 500;
						res.end();
						log.error('Internal error(%d): %s',res.statusCode,err.message);	
					}
					if(results){
						oneTest.questions = results;
						return res.json(outData.testToJson(oneTest));	
					}
				}
			);	
		} else {
			res.statusCode = 500;
			res.end();
			log.error('Internal error(%d): %s',res.statusCode,err.message);
		}
	});
});


router.post('/', authenticateAdmin, function(req, res) {
//router.post('/', passport.authenticate('bearer_admin', { session: false }), function(req, res) {
//router.post('/', function(req, res) {
			
	var attributes = req.body.data;
	
	verifyPostedTest(attributes, function(status){
		if(status === 'ok'){
			createNewTest(attributes, function(err){
				if(!err){
					res.statusCode = 200;
					res.end();	
				} else {
					res.statusCode = 500;
					res.end();
					log.error('Internal error(%d): %s', res.statusCode, err.message);						
				}	
			});	
		} else {
			res.status(400).send({ error: status});
		}
	});	
});

router.post('/:id', authenticateAdmin, function(req, res) {
//router.post('/:id', passport.authenticate('bearer_admin', { session: false }), function(req, res) {
//router.post('/:id', function(req, res) {
		
	var attributes = req.body.data;
	
	verifyPostedTest(attributes, function(status){
		if(status === 'ok'){
			clearOldtestData(req.params.id, function(err, testForUpdate){
				if(!err){		
					updateTest(testForUpdate, attributes, function(err){
						if(!err){
							res.statusCode = 200;
							res.end();	
						} else {
							res.statusCode = 500;
							res.end();
							log.error('Internal error(%d): %s', res.statusCode, err.message);						
						}	
					});		
				} else {
					res.statusCode = 500;
					res.end();
					log.error('Internal error(%d): %s', res.statusCode, err.message);		
				}
			});
		} else {
			res.status(400).send({ error: status});
		}
	});
	
});

router.delete('/:id', passport.authenticate('bearer_admin', { session: false }), function(req, res) {	
//router.delete('/:id',  function(req, res) {
		
	clearOldtestData(req.params.id, function(err, testToDelete){
		if(!err){		
			deleteTest(testToDelete, function(err){
				if(!err){
					res.statusCode = 200;
					res.end();	
				} else {
					res.statusCode = 500;
					res.end();
					log.error('Internal error(%d): %s', res.statusCode, err.message);						
				}	
			});	
		} else {
			res.statusCode = 500;
			res.end();
			log.error('Internal error(%d): %s', res.statusCode, err.message);		
		}
	});
	
});


function createNewTest(attributes, cback){
	var rawQuestions =  attributes['questions'];	
	
	var newTest = new Test({ 
		"isAvailable": true,
		"availabilityText": '',
		"testName": attributes['testName'],
		"isPublic": attributes['isPublic'],
		"startDate": attributes['startDate'],
		"endDate": attributes['endDate'],
		"questions": []
    });
	
	saveTestToDb(newTest, rawQuestions, function(err){
		if (typeof(cback) == "function"){
			return cback(err);	
		}	
	});
	
};

function saveTestToDb(newTest, rawQuestions, cback){
	var statQuestions = [];
	var postQuestions = [];
	newTest.save(function (err,savedTest) {
		if (!err) {	
			async.forEachOf(rawQuestions, function(item, index, callback){
				
				var questionData = {
					"textDescription":item['textDescription'] || '',
					"type": item['type'] || 'radio',
					//"imgUrl": { type: String },
					"imgId": item['imgId'] || '',
					"answersAreImages": item['answersAreImages'] || false,
					"imageIncluded": item['imageIncluded'] || false,
					"textAnswer": item['textAnswer'] || '',
					"allAnswers": item['allAnswers']
				}
				
				parseQuestionForImgUrl(questionData, savedTest.id, function(newData){
					
					parseAnswersForImgUrl(newData,  savedTest.id, function(finData){
						
						var newQuestion = new Question(finData);
						newQuestion.save(function (err,savedQuestion){
						
							statQuestions[index] = {
								"id": savedQuestion.id,
								"name": index + 1,
								"shortId": 'q_'+index
							};	
							/*statQuestions.push({
								"id": 'q_'+index,
								"name": index + 1	
							});	*/
							postQuestions[index] = savedQuestion.id;
							callback(err);
							/*
							addQuestionIdToTest(savedTest.id, savedQuestion.id, index, function(err){

									callback(err);	

							});	*/											
						});	
					});	
					
				});	
			},
				function(err){				
					if(!err){
						addQuestionIdToTest(savedTest.id, postQuestions, function(err){	
							if (typeof(cback) == "function"){
								return cback(err);	
							}			
						});
						createStatistics(savedTest, statQuestions);
					}				
				}
			);	
		} else {
			log.error('Internal error(%d): %s', res.statusCode, err.message);	
			if (typeof(cback) == "function"){
				return cback(err);	
			}	
		}
	});		
};

function clearOldtestData(testId, cback){
	Test.findById(testId, function (err, oneTest) {	
		if(!oneTest) {	
			if (typeof(cback) == "function"){
				return cback('tesi not found by id: ', testId);	
			}	
		} else if (!err) {	
			oneTest.isAvailable = true;
			oneTest.availabilityText = '';
			oneTest.testName = '';
			oneTest.isPublic = true;
			oneTest.startDate = '';
			oneTest.endDate = '';
		
			async.forEachOf(oneTest.questions,
				function(item, index, callback){
					deleteQuestion(testId, item, function(err, oldImgIdsInQuestion){
						callback(err);										
					});			
				},
				function(err){
					if (typeof(cback) == "function"){
						oneTest.questions = [];
						return cback(err, oneTest);	
					}
				}
			);	
		} else {
			if (typeof(cback) == "function"){
				return cback(err);	
			}
		}
	});	
};

function updateTest(oneTest, attributes, cback){
	var rawQuestions =  attributes['questions'];
	var statQuestions = [];
	
	oneTest.isAvailable = true;
	oneTest.availabilityText = '',
	oneTest.testName = attributes['testName'],
	oneTest.isPublic = attributes['isPublic'],
	oneTest.startDate = attributes['startDate'],
	oneTest.endDate = attributes['endDate'],
	oneTest.questions = []
	
	saveTestToDb(oneTest, rawQuestions, function(err){
		if (typeof(cback) == "function"){
			return cback(err);	
		}	
	});
};	

function createStatistics(savedTest, statQuestions){

	Statistics.find({'testId': savedTest.id}, function (err, allStats) {						
		if(allStats && allStats.length) {
			newStats = allStats[0];
			
			newStats.testName = savedTest.testName;
			newStats.userAnswers = [];
			newStats.questions = statQuestions;
			
			newStats.save(function (err,savedStats) {
				if (!err) {	
					
				} else {
					log.error('Internal error(%d): %s', res.statusCode, err.message);
				}
			});		
		} else {
			if (err) {
				log.error('Internal error(%d): %s',res.statusCode,err.message);
			}
			
			var newStatistics = new Statistics({
				"testId": savedTest.id,		
				"testName": savedTest.testName,	
				"userAnswers": [],
				"questions": statQuestions			
			});
			
			newStatistics.save(function (err,savedStats) {
				if (!err) {	
					
				} else {
					log.error('Internal error(%d): %s', res.statusCode, err.message);
				}
			});	
		}
	});
};	

function addQuestionIdToTest(testId, questionIds, callback){
	Test.findById(testId, function (err, oneTest) {								
		if(!oneTest) {
			if (typeof(callback) == "function"){
				return callback('test not found by id:' + testId);	
			}		
		} else if (!err) {
			oneTest.questions = questionIds;	
			oneTest.save(function (err,savedTest) {
				callback(err);
			});										
		} else {
			log.error('Internal error(%d): %s',res.statusCode,err.message);
			callback(err);
		}
	});	
};

function parseQuestionForImgUrl(questionData, testId, callback){
	if(questionData.imageIncluded && questionData.imgId){
		imgIdToUrl(questionData.imgId, testId, function(url,err){
			if(!err && url){
				questionData.imgUrl = url;
			}
			callback(questionData);
		});
	} else {
		callback(questionData);	
	}
}

function parseAnswersForImgUrl(questionData, testId, cback){
	if(questionData.answersAreImages && questionData.allAnswers.length){
		async.forEachOf(questionData.allAnswers,
			function(item, index, callback){				
				imgIdToUrl(item.imgId, testId, function(url,err){
					if(!err && url){						
						item.imgUrl = url;
					}
					callback();
				});			
			},
			function(err){
				cback(questionData);	
			}
		);
	} else {
		cback(questionData);		
	}
}

function imgIdToUrl(imgId, testId, callback){	
	TestImage.findById(imgId, function (err, oneTestImage) {
		if(!oneTestImage) {
			log.error('image not found by id:-- ', imgId);
			if (typeof(callback) == "function"){
				return callback();			
			}
		} else if (!err) {
			if(testId){
				oneTestImage.testIds.push(testId);
				oneTestImage.save(function (err2,savedImg) {
					if (!err2) {	
						if (typeof(callback) == "function"){
							return callback(oneTestImage.url, err);	
						}
					} else {
						log.error('Internal error(%d): %s', res.statusCode, err.message);
					}
				});
			}			
		} else {			
			log.error('Internal error(%d): %s',res.statusCode,err.message);
			if (typeof(callback) == "function"){
				return callback(err);	
			}		
		}
	});
};


function deleteQuestion(testId, questionToDelId, callback){
	Question.findById(questionToDelId, function (err, oneQuestion) {
		if(!oneQuestion) {
			callback('Question not found: ', questionToDelId);
		} else if (!err) {
			if(oneQuestion.allAnswers.length){
				oneQuestion.allAnswers.forEach(function(item){
					if(item.imgId){
						removeTestIdFromImage(item.imgId, testId);
					}
				});
			} 
			if(oneQuestion.imgId){
				removeTestIdFromImage(oneQuestion.imgId, testId);	
			}
			oneQuestion.remove({},function(err) {
				if (typeof(callback) == "function"){
					callback(err);
				}	
			});	
		} else {
			if (typeof(callback) == "function"){
				callback(err);
			}
		}
	});
};

function getQuestionById(questionId, callback){
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

function removeTestIdFromImage(imgId, testId){
	TestImage.findById(imgId, function (err, oneTestImage) {
		if(!oneTestImage) {
			log.error('image not found by id:--2 ', imgId);		
		} else if (!err) {
			oneTestImage.testIds = outData.removeValueFromArray(oneTestImage.testIds, testId);
			oneTestImage.save(function(err){
				if(err) {
					log.error('Internal error(%d): %s', res.statusCode, err.message);	
				}	
			});
		} else {			
			log.error('Internal error(%d): %s',res.statusCode,err.message);
		}
	});		
};

function deleteTest(testToDel, callback){
	testToDel.remove({},function(err) {
		if (typeof(callback) == "function"){
			callback(err);
		}		
	});
};

function verifyPostedTest(newTest, callback){
	var status = "";
	
	if(newTest){
		
		if(!newTest.testName){
			status+= 'Test have no name. ';
		} 
				
		if(!newTest.questions.length){
			status+= 'Test have no questions. ';
		}
			
		if(!verifyTime(newTest.startDate, newTest.endDate)){
			status+= 'Check start/end time. ';
		}	
		
		var questionsVeryfy = true;
		newTest.questions.forEach(function(item){	
			if(!verifyQuestion(item)){				
				questionsVeryfy = false;				
			}
		});
		
		if(!questionsVeryfy){
			status+= 'Questions are incorect. ';
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
	
	if(question.imageIncluded && !question.imgId) {
		verified = false;	
	}

	if(!question.textDescription){
		verified = false;	
	}
	
	if(question.type === "text") {// if type is text check that answer is present,
		if(!question.textAnswer) {
			verified = false;							
		}
	} else {
		// check if there is more than 1 answer
		if(question.allAnswers.length < 2) {
			verified = false;	
		}
		// check if answers are filled or images are selected
		if(question.answersAreImages) {
			question.allAnswers.forEach(function(item){
				if(!item.imgId){
					verified = false;
				}
			});
		} else {
			question.allAnswers.forEach(function(item){
				if(!item.text)	verified = false;
			});	
		}
		// check if correct answers chosen	
		if(!verifyAnswer(question)){
			verified = false;	
		}	
	}
	
	return verified;
};

function verifyTime (startDate, endDate){		
	if(endDate >= startDate && endDate && startDate){
		return true;	
	} else {
		return false;	
	}
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

function authenticateAdmin(req, res, next){
	passport.authenticate('bearer_admin', { session: false }, function(err, user, info) {	
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