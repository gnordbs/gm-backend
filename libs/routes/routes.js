var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var DriveRoute = require(libs + 'model/driveroute');
var User = require(libs + 'model/user');
var outData = require(libs + 'handle/data');
var util = require('util');
/*
router.get('/:startPlaceId/:endPlaceId',  function(req, res) {

	//var startPlaceId =req.body.startPlaceId;
	//var endPlaceId =req.body.startPlaceId;
	var startPlaceId = req.params.startPlaceId;
	var endPlaceId = req.params.endPlaceId;
	console.log('startPlaceId      ' + startPlaceId);
	console.log('endPlaceId      ' + endPlaceId);
	if(startPlaceId == endPlaceId){
		DriveRoute.find({ 'stored-start-id' : startPlaceId }, function (err, route) {
			//console.log('endPlaceId      ' + route);
			return res.json({ 
				'data': outData.routesToJsonV_1(route) 
			});
			
			
			
		});
		
		
	};
	
	
});
*/	
	

router.get('/',  function(req, res) {
	console.log('GET request to api/routes/      ' );
	DriveRoute.find({}, function (err, route) {
		
		if(!route) {
			res.statusCode = 404;
			res.end();
			//return res.json({ 
			//	error: 'Not found' 
			//});
		}
		
		if (!err) {
			


			
			return res.json({ 
				'data': outData.routesToJsonV_1(route) 
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
});


router.get('/:id',  function(req, res) {
	
	DriveRoute.findById(req.params.id, function (err, route) {
		
		if(!route) {
			res.statusCode = 404;
			res.end();
			//return res.json({ 
			//	error: 'Not found' 
			//});
		}
		
		if (!err) {
			return res.json({ 
				//'data': outData.routeToJson(route)
				'data': outData.routesToJsonV_1(route)
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
});


/*
router.get('/', passport.authenticate('bearer', { session: false }), function(req, res) {
	
	DriveRoute.find(function (err, articles) {
		if (!err) {
			return res.json(articles);
		} else {
			res.statusCode = 500;
			
			log.error('Internal error(%d): %s',res.statusCode,err.message);
			
			return res.json({ 
				error: 'Server error' 
			});
		}
	});
});
*/
/*      ////////////////
router.post('/',function(req, res, next) {
 passport.authenticate('bearer',{session: false}, function(err, user, info){
	console.log('own cb was called  err    ' + err);
	console.log('user    ' + user);
	console.log('info      ' + info);
    //if (err) { return next(err); }
  //  if (!user) { return res.redirect('/'); }

    // req / res held in closure

  })(req, res, next);
});
*/


router.post('/', passport.authenticate('bearer', { session: false }), function(req, res) {
//router.post('/', function(req, res) {
	console.log('routes post called');
	
	//var attributes =req.body.data;

	//var attributes1 =JSON.parse('{"qwe":"456"}');
	//var attributes1 =JSON.parse(req.body.data);
	//var attributes = JSON.parse(req.body.data);
	//var attributes =req.body.data.toObject();;
	//console.log('attributes  ' + util.inspect(req.body.data, {showHidden: false, depth: null}));
	//console.log('req.body.data  ' + req.body.data);
	//console.log('attributes  ' + attributes);
	//console.log('attributes  ' + req.body.data.stored);
	//console.log(attributes.stored-start-id);
	
	var attributes = req.body.data.attributes;
	console.log(util.inspect(req.body.data, {showHidden: false, depth: null}));
	//console.log('attributes' + attributes['stored-start-city);
	var driveRoute = new DriveRoute({ 
    "driver_id": req.user.id ,
	"stored-path": attributes['stored-path'],
	"stored-description": attributes['stored-description'],
	"stored-phone": attributes['stored-phone'],
	"stored-name": attributes['stored-name'],
	"stored-start-city": attributes['stored-start-city'],
	"stored-end-city": attributes['stored-end-city'],
	"stored-inter-city": attributes['stored-inter-city'],
	"stored-directions": attributes['stored-directions'],
	"stored-start-id": attributes['stored-start-id'],
	"stored-end-id": attributes['stored-end-id'],
	"stored-date": attributes['stored-date'],
	"stored-is-one-date": attributes['stored-is-one-date'],
	"stored-length":attributes['stored-length'],
	"stored-middle-countries": attributes['stored-middle-countries']
    });
	
	console.log('storedStartCity        ' + driveRoute['storedStartCity']);
	
	User.findById(req.user.id, function(err, user) {
		if(err){
			res.statusCode = 500;
			res.end();
			//res.json({ 
			//		error: 'No User' 
			//});
		}
		else {

			driveRoute.save(function (err,savedRoute) {
				if (!err) {
					log.info("New route created with id: %s", savedRoute.id);
					
					var driveRouteUpdated = user.driveRoute.push(savedRoute.id);
					user.save({driveRoute: driveRouteUpdated }, function (err, post) {
						if (err) { 
						console.log('save user relation to driveRoute fail:' + err);
						}
						else {
							console.log('save user relation to driveRoute ok:');
						};

					});
					
					return res.json({ 
						'data': outData.routesToJsonV_1(savedRoute)
					});				
					
				} else {
					if(err.name === 'ValidationError') {////////////delete   !!!!!
						res.statusCode = 400;
						res.end();
						//res.json({ 
						//	error: 'Validation error' 
						//});
					} else {
						res.statusCode = 500;
						res.end();
						//res.json({ 
						//	error: 'Server error' 
						//});
					}
					log.error('Internal error(%d): %s', res.statusCode, err.message);
				}
			});
		}
	});
	
});

router.delete('/:id', passport.authenticate('bearer', { session: false }), function(req, res) {
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
/*
router.get('/:id', passport.authenticate('bearer', { session: false }), function(req, res) {
	
	Article.findById(req.params.id, function (err, article) {
		
		if(!article) {
			res.statusCode = 404;
			
			return res.json({ 
				error: 'Not found' 
			});
		}
		
		if (!err) {
			return res.json({ 
				status: 'OK', 
				article:article 
			});
		} else {
			res.statusCode = 500;
			log.error('Internal error(%d): %s',res.statusCode,err.message);
			
			return res.json({ 
				error: 'Server error' 
			});
		}
	});
});

router.put('/:id', passport.authenticate('bearer', { session: false }), function (req, res){
	var articleId = req.params.id;

	Article.findById(articleId, function (err, article) {
		if(!article) {
			res.statusCode = 404;
			log.error('Article with id: %s Not Found', articleId);
			return res.json({ 
				error: 'Not found' 
			});
		}

		article.title = req.body.title;
		article.description = req.body.description;
		article.author = req.body.author;
		article.images = req.body.images;
		
		article.save(function (err) {
			if (!err) {
				log.info("Article with id: %s updated", article.id);
				return res.json({ 
					status: 'OK', 
					article:article 
				});
			} else {
				if(err.name === 'ValidationError') {
					res.statusCode = 400;
					return res.json({ 
						error: 'Validation error' 
					});
				} else {
					res.statusCode = 500;
					
					return res.json({ 
						error: 'Server error' 
					});
				}
				log.error('Internal error (%d): %s', res.statusCode, err.message);
			}
		});
	});
});
*/
module.exports = router;