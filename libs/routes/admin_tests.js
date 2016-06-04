var express = require('express');
var passport = require('passport');
var async = require('async');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var Test = require(libs + 'model/test');
var Question = require(libs + 'model/question');
var Statistics = require(libs + 'model/Statistics');
var outData = require(libs + 'handle/data');
var util = require('util');


router.get('/',  function(req, res) {
	console.log('----------------------GET request to api/tests/      ' );
	Test.find({}, function (err, allTests) {
			
		if(!allTests) {
			res.statusCode = 404;
			res.end();
		}
		
		if (!err) {
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
		}
		
		if (!err) {
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
	
	var rawQuestions =  attributes['questions'];
	var statQuestions = [];
	
	var newTest = new Test({ 
		"isAvailable": true,
		"availabilityText": '',
		"testName": attributes['testName'],
		"isPublic": attributes['isPublic'],
		"startDate": attributes['startDate'],
		"endDate": attributes['endDate'],
		"questions": []
    });
	console.log("rawQuestions ---------", rawQuestions);
	async.forEachOf(rawQuestions,
		function(item, index, callback){
			console.log("item ---------", item);
			var newQuestion = new Question({
				"textDescription":item['textDescription'] || '',
				"type": item['type'] || 'radio',
				//"imgUrl": { type: String },
				"imgId": item['imgId'] || '',
				"answersAreImages": item['answersAreImages'] || false,
				"imageIncluded": item['imageIncluded'] || false,
				"textAnswer": item['textAnswer'] || '',
				"allAnswers": item['allAnswers']
			});

			
			
			
			newQuestion.save(function (err,savedQuestion){
				newTest.questions.push(savedQuestion.id);
				statQuestions.push({
					//"id": savedQuestion.id,
					"id": 'q_'+index,
					"name": index	
				});
				callback();
			});
		},
		function(err){
			console.log('end');
			newTest.save(function (err,savedTest) {
				if (!err) {	
					if(savedTest){
						createStatistics(savedTest);	
					}
					res.statusCode = 200;
					res.end();
					//return res.json(outData.routesToJsonV_1(savedTest));					
				} else {
					if(err.name === 'ValidationError') {////////////delete   !!!!!
						res.statusCode = 400;
						res.end();
					} else {
						res.statusCode = 500;
						res.end();
					}
					log.error('Internal error(%d): %s', res.statusCode, err.message);
				}
			});
		}
	);	
	
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
	
	/*	
	function makeQestion(item, callback){
			console.log('---------------------------async.each.item');
		var newQuestion = new Question({
			"text":item['text'] || '',
			"isDefault":item['isDefault'] || false,
			"isTrue":item['isTrue'] || false,
			"imgId":item['imgId'] || '',
			"imgUrl":item['imgUrl'] || ''	
		});
		
		newQuestion.save();	
	}
	
	function saveQuestionCallback(err,savedQuestion) {
		if (!err) {		
			log.info("New question created with id: %s", question.id);
			nesTest.question.push(savedQuestion.id);				
		} else {				
			log.error('Internal error(%d): %s', res.statusCode, err.message);
		}	
	}
		
			console.log('---------------------------async.each');
	async.each(rawQuestions,
		makeQestion(rawQuestions, saveQuestionCallback),
		function(err){
			if (!err) {		
				nesTest.save(function (err,savedTest) {
					if (!err) {		
						return res.json(outData.routesToJsonV_1(savedTest));					
					} else {
						if(err.name === 'ValidationError') {////////////delete   !!!!!
							res.statusCode = 400;
							res.end();
						} else {
							res.statusCode = 500;
							res.end();
						}
						log.error('Internal error(%d): %s', res.statusCode, err.message);
					}
				});				
			}
		}
	);
	*/	
	
	
});



router.delete('/:id', passport.authenticate('bearer', { session: false }), function(req, res) {
		console.log('---------------------------tests delete called');
//router.delete('/:id',  function(req, res) {
console.log('access_token        ' + req.body.access_token);
console.log('mydata        ' + req.body.mydata);
//console.log(util.inspect(req.body, {showHidden: false, depth: null}));



	console.log('routes DELETE was called');
	var user = req.user;
	console.log(util.inspect(req.user, {showHidden: false, depth: null}));

	if(!user){
		console.log('No User');
		res.statusCode = 204;
		res.end();
		//res.json({ 
		//	error: 'No User' 
		//})
	}
	else {
		if(user.deleteRouteId(req.params.id)){
			console.log('delete route_id from User OK');
			
			DriveRoute.findById(req.params.id, function(err, route) {
				if(!route) {
					res.statusCode = 404;
					res.end();
					//return res.json({ 
					//	error: 'Route not found' 
					//});
				}
				if (!err) {
				
					route.remove({},function(err, user) {
						if(err){	
							res.statusCode = 500;
							res.end();						
							console.log('err removing driveRoute   ' + req.params.id +  +'  ' + err);
							//res.json({error :err});
						} else {
							res.statusCode = 200;
							res.end();
							console.log('driveRoute deleted  ok  ' + req.params.id);
						}	
					});	
					

				} else {
					res.statusCode = 500;
					res.end();
					log.error('Internal error(%d): %s',res.statusCode,err.message);
					
					//return res.json({ 
					//	error: 'Server error' 
					//});
				}

			});
		}
		else {
			console.log('delete route_id from User failed');
			res.statusCode = 204;
			res.end();
			//return res.json({ 
			//	error: 'User have no such route' 
			//});
		};		
	};
	


});


module.exports = router;