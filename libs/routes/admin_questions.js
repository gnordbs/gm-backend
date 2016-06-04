var express = require('express');
var passport = require('passport');
var async = require('async');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var Question = require(libs + 'model/question');
var outData = require(libs + 'handle/data');
var util = require('util');


router.get('/:id',  function(req, res) {
	console.log('---------------------------question get id called');
	Question.findById(req.params.id, function (err, oneQuestion) {
		
		if(!oneQuestion) {
			res.statusCode = 404;
			res.end();
			//return res.json({ 
			//	error: 'Not found' 
			//});
		}
		
		if (!err) {
			return res.json(oneQuestion);	
			//return res.json(outData.routesToJsonV_1(oneTest));
		} else {
			res.statusCode = 500;
			res.end();
			log.error('Internal error(%d): %s',res.statusCode,err.message);
		}
	});
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