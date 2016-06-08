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

router.get('/',  passport.authenticate('bearer', { session: false }), function(req, res) {
//router.get('/',  function(req, res) {
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
});

router.get('/:id', passport.authenticate('bearer', { session: false }), function(req, res) {
//router.get('/:id',  function(req, res) {
	Test.findById(req.params.id, function (err, oneTest) {
		
		if(!oneTest) {
			res.statusCode = 404;
			res.end();
			//return res.json({ 
			//	error: 'Not found' 
			//});
		} else if (!err) {
			return res.json(outData.testToJson(oneTest));	
			//return res.json(outData.routesToJsonV_1(oneTest));
		} else {
			res.statusCode = 500;
			res.end();
			log.error('Internal error(%d): %s',res.statusCode,err.message);
		}
	});
});





router.post('/', passport.authenticate('bearer', { session: false }), function(req, res) {
//router.post('/', function(req, res) {
	//console.log('---------------------------tests post called');
			
	var attributes = req.body.data;
	
	//console.log('attributes  ' + attributes);
	//console.log(util.inspect(req.body.data, {showHidden: false, depth: null}));
	
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
	
});


router.post('/:id', passport.authenticate('bearer', { session: false }), function(req, res) {
//router.post('/:id', function(req, res) {
		
	var attributes = req.body.data;
	
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
	newTest.save(function (err,savedTest) {
		if (!err) {	
			async.forEachOf(rawQuestions,
			function(item, index, callback){
				
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
							statQuestions.push({
								"id": 'q_'+index,
								"name": index	
							});							
							addQuestionIdToTest(savedTest.id, savedQuestion.id, function(err){
								//if(!err){
									callback(err);	
								/*} else {
									log.error('Internal error(%d): %s',res.statusCode,err.message);										
									if (typeof(cback) == "function"){
										return cback(err);	
									}	
								}*/
							});												
						});	
					});	
					
				});	
			},
			function(err){
				if(!err){
					createStatistics(savedTest, statQuestions);
				}
				if (typeof(cback) == "function"){
					return cback(err);	
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

function addQuestionIdToTest(testId, questionId, callback){
	Test.findById(testId, function (err, oneTest) {								
		if(!oneTest) {
			if (typeof(callback) == "function"){
				return callback('test not found by id:' + testId);	
			}		
		} else if (!err) {
			oneTest.questions.push(questionId);
			oneTest.save(function (err,savedTest) {
				callback(err);
			});										
		} else {
			log.error('Internal error(%d): %s',res.statusCode,err.message);
			callback(err);
		}
	});	
}



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

/*
function deleteImage(imageToDel, callback){
	fs.unlink(imageToDel.url, (err) => {
		if (err) throw err;
		console.log('successfully deleted  --- ', imageToDel.url);
	});
	imageToDel.remove({},function(err) {
		if(err){		
			log.error('Internal error(%d): %s',res.statusCode,err.message);
			callback(err);
		} else {
			if (typeof(callback) == "function"){
				//somemethodtodeleteimgfromfolder();
				//console.log("somemethodtodeleteimgfromfolder");
				callback(err);
			}
		}	
	});	
};
*/








router.delete('/:id', passport.authenticate('bearer', { session: false }), function(req, res) {	
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


module.exports = router;