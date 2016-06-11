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
var outData = require(libs + 'handle/data');
var util = require('util');


router.get('/',  function(req, res) {

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


router.get('/:id',  function(req, res) {
	//console.log('---------------------------tests get id called');
	Test.findById(req.params.id, function (err, oneTest) {
		console.log("oneTest..................qqq",oneTest);
		
		if(!oneTest) {
			res.statusCode = 404;
			res.end();
		} else if (!err) {		
			var availavilityText = testTimingCheck(oneTest);
			if(availavilityText !== ""){
				console.log("oneTest...not aval...............",availavilityText);
				
				oneTest.isAvailable = false;
				oneTest.availabilityText = availavilityText;
				oneTest.questions = [];
				return res.json(outData.testToJson(oneTest));
			} else {		
				console.log("oneTest..................1",oneTest);
				
				async.map(oneTest.questions,
					function(item, callback){	
						//console.log("get test id--------------*", item);
						getQuestionById(item, function(err, oneQuestion){
							if(!err && oneQuestion){
								callback(null, oneQuestion);	
							} else {
								callback(err);	
							}
						});					
					},
					function(err, results){
						console.log("get test id--------------f", err, results);
						if(err) {
							res.statusCode = 500;
							res.end();
							log.error('Internal error(%d): %s',res.statusCode,err.message);	
						}
						if(results){
							oneTest.questions = results;
							//console.log("get test id----oneTest.quesions", oneTest.quesions);
							
							console.log("oneTest..................",oneTest);
							return res.json(outData.testToJson(oneTest));	
						}
					}
				);
			}
		} else {
			res.statusCode = 500;
			res.end();
			log.error('Internal error(%d): %s',res.statusCode,err.message);
		}
	});
});





//router.post('/', passport.authenticate('bearer', { session: false }), function(req, res) {
router.post('/', function(req, res) {
	//console.log('---------------------------tests post called');
		
	var attributes = req.body.data;

	//var rawQuestions =  attributes['questions'];
	
	verifyPostedTest(attributes, function(status){
		if(status === 'ok'){		
			var newUserAnswer = new UserAnswer({ 
				"testId": attributes.id,		
				"name": attributes.userForm.name,
				"surname": attributes.userForm.surname,
				"phone": attributes.userForm.phone,
				"email": attributes.userForm.email,
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
							
								switch (savedQuestion.type){	
									case "text":
									
										var isCorrect = false;
										if(savedQuestion.textAnswer === item.textAnswer){
											isCorrect = true;
											ratio++;
										}
										newUserAnswer.answers.push({
											"qId":'q_'+answerIndex,
											"isCorrect": isCorrect
										});
										callback();
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
										
										newUserAnswer.answers.push({
											"qId": 'q_'+answerIndex,
											"isCorrect": isCorrect
										});
										callback();
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
										
										newUserAnswer.answers.push({
											"qId": 'q_'+answerIndex,
											"isCorrect": isCorrect
										});
										callback();
									break;
								}
							
											
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
			
			
});

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

function testTimingCheck(oneTest){
	var avText = "";
	var startDate =  oneTest.startDate || '';
	var endDate =  oneTest.endDate || '';
	
	var currentDate = new Date();
	
	if(currentDate < startDate){
		var startDay = startDate.toDateString();
		avText = "This will be available on " + startDay;
		return avText;	
	} else if (currentDate < endDate) {
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
			
		var userForm = newTest.userForm;
		// check if user form data is filled
		if(!(userForm.name && userForm.surname && userForm.phone && userForm.email)){
			status+= "User data is incorrect. ";
		} 	
		
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


module.exports = router;