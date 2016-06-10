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
	console.log('----------------------GET request to api/tests/      ' );
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
		
		if(!oneTest) {
			res.statusCode = 404;
			res.end();
		} else if (!err) {		
			var availavilityText = testTimingCheck(oneTest);
			if(availavilityText !== ""){
				oneTest.isAvailable = false;
				oneTest.availabilityText = availavilityText;
			}
			
			return res.json(outData.testToJson(oneTest));	
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
	console.log("------rawAnswers-------", rawAnswers);
				
	async.forEachOf(rawAnswers,
		function(item, answerIndex, callback){
			console.log("------item-------", item);
			Question.findById(item.id, function (err, savedQuestion) {
				
				if(!savedQuestion) {
					res.statusCode = 404;
					res.end();
				} else if (!err) {
					console.log("------findById-------");
					
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
				console.log("newUserAnswer.rating ",newUserAnswer);	
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
			
			
});

function testTimingCheck(oneTest){
	var avText = "";
	var startDate =  oneTest.startDate || '';
	var endDate =  oneTest.endDate || '';
	
	var currentDate = new Date();
	
	console.log("date---- ", startDate, endDate, currentDate);
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
}

function testIsPublicCheck(oneTest){
	if(oneTest && oneTest.isPublic){
		return true;
	} else {
		return false;	
	}
}





module.exports = router;