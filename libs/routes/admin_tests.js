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


router.get('/',  function(req, res) {
	console.log('----------------------GET request to api/tests/      ' );
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


router.get('/:id',  function(req, res) {
	//console.log('---------------------------tests get id called');
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





//router.post('/', passport.authenticate('bearer', { session: false }), function(req, res) {
router.post('/', function(req, res) {
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



router.post('/:id', function(req, res) {
	console.log('---------------------------tests post called',req.params.id);

	var attributes = req.body.data;
	
	//var oldImgIds = []; // save old img IDs to delete
	//var newImgIds = []; // new img IDs
	
	//console.log("newQuestionIds.------------", newImgIds);
	
	/*if(attributes.questions){
		attributes.questions.forEach(function(item){
			if(item.imageIncluded && item.imgId){
				newImgIds.push(item.imgId);
				console.log("newQuestionIds.push(item.imgId);", item.imageIncluded , item.imgId);
			}	
			if(item.allAnswers && item.answersAreImages){
				item.allAnswers.forEach(function(answer){
					if(answer.imgId){
						newImgIds.push(answer.imgId);	
					}	
				});
			}
		});
	}*/
	//console.log("newQuestionIds.-----------2-", newImgIds);
	
	clearOldtestData(req.params.id, function(err, testForUpdate){
			console.log('--------------------------clearOldtestData end');
		if(!err){		
			updateTest(testForUpdate, attributes, function(err){
				console.log('--------------------------updateTest end');
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
	
	/*
	Test.findById(req.params.id, function (err, oneTest) {	
		if(!oneTest) {			
			//somemethodtocreatenewtest();
		} else if (!err) {	
			console.log("oneTest------", oneTest)
			async.forEachOf(oneTest.questions,
				function(item, index, callback){
					deleteQuestion(item, function(err, oldImgIdsInQuestion){
						if(!err){
							console.log("oldImgIdsInQuestion.-----------------------------", oldImgIdsInQuestion);
							if(oldImgIdsInQuestion.length){
								console.log("oldImgIds.------------------------1-----", oldImgIds);
								oldImgIds = oldImgIds.concat(oldImgIdsInQuestion);
								console.log("oldImgIds.------------------------2-----", oldImgIds);
							}
						}
						callback();
					});			
				},
				function(err){
					if(!err){
						updateTest(oneTest);	
					} else {
						log.error('Internal error(%d): %s',res.statusCode,err.message);	
					}
				}
			);	
		} else {
			res.statusCode = 500;
			res.end();
			log.error('Internal error(%d): %s',res.statusCode,err.message);
		}
	});*/

	/*
	function updateTest(oneTest){
		oneTest.isAvailable = true;
		oneTest.availabilityText = '',
		oneTest.testName = attributes['testName'],
		oneTest.isPublic = attributes['isPublic'],
		oneTest.startDate = attributes['startDate'],
		oneTest.endDate = attributes['endDate'],
		oneTest.questions = []

		var rawQuestions =  attributes['questions'];
		
		saveNewQuestions(rawQuestions, function(err, newQuestionIds){
			if(!err){
				oneTest.questions = newQuestionIds;
				oneTest.save(function (err,savedTest) {
					if (!err) {	
						//if(savedTest){
						//	createStatistics(savedTest);	
						//}
						res.statusCode = 200;
						res.end();	
						
						removeUnusedImages(oldImgIds, newImgIds);
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
		});
	};	*/
	
	function createStatistics(savedTest){

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
	};	
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
	
	/*
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
									if(!err){
										callback();	
									} else {
										log.error('Internal error(%d): %s',res.statusCode,err.message);										
										if (typeof(cback) == "function"){
											return cback(err);	
										}	
									}
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
	});	*/
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
		
			console.log('--------------------------async.forEachOf oneTest.questions start');
			async.forEachOf(oneTest.questions,
				function(item, index, callback){
					console.log('--------------------------async.forEachOf oneTest.questions start --', index);
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
		console.log('--------------------------updateTest start');
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
		console.log('_-_-_-testId_-', testId);
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

function saveNewQuestions(rawQuestions, cback){
	var newQuestionIds = [];
	if(rawQuestions.length){
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
				
				parseQuestionForImgUrl(questionData, function(newData){	
					parseAnswersForImgUrl(newData, function(finData){			
						var newQuestion = new Question(finData);
						newQuestion.save(function (err,savedQuestion){
							newQuestionIds.push(savedQuestion.id);
							callback();
						});	
					});	
					
				});	
			},
			function(err){
				if (typeof(cback) == "function"){
					cback(err, newQuestionIds);
				}
			}
		);	
	}
};

function removeUnusedImages(oldImgIds, newQuestionIds){
	console.log("removeUnusedImages", oldImgIds, newQuestionIds);
	if(oldImgIds.length){
			console.log("removeUnusedImages---------0");
		if(newQuestionIds.length){
			console.log("removeUnusedImages---------00");
				var idsToDelete = oldImgIds.filter(function(i) {return newQuestionIds.indexOf(i) < 0;});	
			console.log("removeUnusedImages---------1", idsToDelete);
			deleteImgIdsFromDb(idsToDelete);
		} else {
			console.log("removeUnusedImages---------2", oldImgIds);
			deleteImgIdsFromDb(oldImgIds);	
		}
	}	
};

function deleteImgIdsFromDb(idsToDelete){
	if(idsToDelete.length){
		idsToDelete.forEach(function(item){
			TestImage.findById(item, function (err, oneTestImage) {
				if(!oneTestImage) {
					log.error('image not found by id:--2 ', imgId);		
				} else if (!err) {
					deleteImage(oneTestImage);			
				} else {			
					log.error('Internal error(%d): %s',res.statusCode,err.message);
				}
			});		
		});	
	}	
};

function deleteQuestion(testId, questionToDelId, callback){
	console.log("-+++++++++++++++++++++++deleteQuestion");
	Question.findById(questionToDelId, function (err, oneQuestion) {
		if(!oneQuestion) {
			//log.error('Question not found: ', questionToDelId);
			callback('Question not found: ', questionToDelId);
		} else if (!err) {
			console.log("-+++++++++++++++++++++++deleteQuestion 2");
			if(oneQuestion.allAnswers.length){
				oneQuestion.allAnswers.forEach(function(item){
					if(item.imgId){
						removeTestIdFromImage(item.imgId, testId);
					}
				});
			} 
			console.log("-+++++++++++++++++++++++deleteQuestion 3 id:", oneQuestion.imgId );
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
	console.log("-#########################--------removeTestIdFromImage");
	TestImage.findById(imgId, function (err, oneTestImage) {
		if(!oneTestImage) {
			log.error('image not found by id:--2 ', imgId);		
		} else if (!err) {
			console.log("-#########################--------removeTestIdFromImage 2");
			oneTestImage.testIds = outData.removeValueFromArray(oneTestImage.testIds, testId);
			oneTestImage.save(function(err){
				console.log("-#########################--------removeTestIdFromImage 3", err);	
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
	oneTest.remove({},function(err) {
		if(err){		
			log.error('Internal error(%d): %s',res.statusCode,err.message);
			callback(err);
		} else {
			if (typeof(callback) == "function"){
				callback(err);
			}
		}	
	});
};

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
















//router.delete('/:id', passport.authenticate('bearer', { session: false }), function(req, res) {
		
router.delete('/:id',  function(req, res) {
	console.log('delete route ------------',req.params.id);
	Test.findById(req.params.id, function (err, oneTest) {
		
		if(!oneTest) {
			res.statusCode = 404;
			res.end();
			//return res.json({ 
			//	error: 'Not found' 
			//});
		} else if (!err) {
			oneTest.remove({},function(err) {
				if(err){	
					res.statusCode = 500;
					res.end();		
					log.error('Internal error(%d): %s',res.statusCode,err.message);
				} else {
					res.statusCode = 200;
					res.end();
				}	
			});
			
		} else {
			res.statusCode = 500;
			res.end();
			log.error('Internal error(%d): %s',res.statusCode,err.message);
		}
	});
});


module.exports = router;