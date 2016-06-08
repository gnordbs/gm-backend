var express = require('express');
var passport = require('passport');
var async = require('async');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var Test = require(libs + 'model/test');
var Statistics = require(libs + 'model/Statistics');
var UserAnswer = require(libs + 'model/userAnswer');
var outData = require(libs + 'handle/data');
var util = require('util');


router.get('/',  function(req, res) {
	
});


router.get('/:id', passport.authenticate('bearer', { session: false }), function(req, res) {
//router.get('/:id',  function(req, res) {
	
	
	Statistics.find({'testId': req.params.id}, function (err, allStats) {		
		if(!allStats) {
			res.statusCode = 404;
			res.end();
		} else if (!err) {
			
			UserAnswer.find({'testId': req.params.id}, function (err, queryUserAnswer) {	
				if(!queryUserAnswer) {
					res.statusCode = 404;
					res.end();
				} else if (!err) {
					var data = allStats[0].toObject();
					
					data.users = outData.userStatsToJson(queryUserAnswer);
									
					return res.json(data);	
					//return res.json(outData.routesToJsonV_1(oneTest));
				} else {
					
					res.statusCode = 500;
					res.end();
					log.error('Internal error(%d): %s',res.statusCode,err.message);
				}
			});



		
			//return res.json(allStats);	
			//return res.json(outData.routesToJsonV_1(oneTest));
		} else {
				
			res.statusCode = 500;
			res.end();
			log.error('Internal error(%d): %s',res.statusCode,err.message);
		}
	});
});







module.exports = router;