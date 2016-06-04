var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';

var db = require(libs + 'db/mongoose');
var User = require(libs + 'model/user');
var DriveRoute = require(libs + 'model/driveroute');
var outData = require(libs + 'handle/data');
var util = require('util');



/*
router.get('/', passport.authenticate('bearer', { session: false }), function(req, res) {
	console.log("get users/    " + req.user);
	var user = req.user.toObject();
	if(user){
		var userJson = {};
		userJson.type = "users";
		userJson.id = user.id
		userJson.relationships = {"routes": {
                "data": { "type": "routes", "id": user.driveRoute }
            }};
		
		return res.json({ 
				data: userJson 
			});	
	} else{
		return res.json({ 
			error: 'No user'
		});			
	}
});
*/


router.get('/', passport.authenticate('bearer', { session: false }), function(req, res) {
	console.log("get users/    " + req.user);
	//var user = req.user.toObject();
	var user = req.user;
	if(user){
		return res.json({ 
				data: outData.toJsonDeletePass(user)
			});	
	} else{
		return res.json({ 
			error: 'No user'
		});			
	}
});


router.get('/:id', function(req, res) {
	

        // req.authInfo is set using the `info` argument supplied by
        // `BearerStrategy`.  It is typically used to indicate scope of the token,
        // and used in access control checks.  For illustrative purposes, this
        // example simply returns the scope in the response.
		console.log("/users/:id     " + req.params.id);

		User.findById(req.params.id).select("-hashedPassword").select("-salt").exec(
		function(err, user) {
					console.log("user     " + user);
			if (err) { 
				console.log('err   ' + err)
				res.json({'error' :err});
            } else if (!user) { 
            	res.json({'error' :'no user'}); 
				} else {
					res.json({ 
						data: outData.toJsonDeletePass(user) 
					});	
				}
		});

});

/*
router.get('/:id', function(req, res) {
        // req.authInfo is set using the `info` argument supplied by
        // `BearerStrategy`.  It is typically used to indicate scope of the token,
        // and used in access control checks.  For illustrative purposes, this
        // example simply returns the scope in the response.
		console.log("/users/:id     " + req.params.id);

		User.findById(req.params.id).select("-hashedPassword").select("-salt").exec(
		function(err, user) {
					console.log("user     " + user);
			if (err) { 
				console.log('err   ' + err)
				res.json({'error' :err});
            } else if (!user) { 
            	res.json({'error' :'no user'}); 
				} else {
					res.json({ 
						attributes: user, 
						type: 'users' 
					});	
				}
		});

});
*/


router.delete('/:id', passport.authenticate('bearer', { session: false }), function(req, res) {
	var user = req.user;
	//console.log("/delete/:id     " + req.params.id);
	console.log("/delete/:id     " + user.id);

	User.findById(user.id, function(err, user) {
		console.log("user     " + user);
		if (err) { 
			console.log('user find error: ' + err);
			res.json({ 
				error: err 
			});
        } 
		else {
	
			if (!user) { 
				res.statusCode = 204;
				res.end()
				//res.json({ 
				//	error: 'Not found' 
				//});
			} 
			else {
				
				if(user.driveRoute.length > 0){
					console.log('user.driveRoute  ' + user.driveRoute)
					DriveRoute.remove({'driver_id' : user.id }, function (err) {
						if (err) {
							console.log('user routes find error:   ' + err)  
							  
						}else {
							console.log('user routes removed OK')
						}
							  
						  
						  // removed!
					});
					/*
					DriveRoute.find({'driver_id' : user.id },function(err, route){
						if(err){				
							console.log('user routes find error:   ' + err)
						} 
						else{
							//console.log('route.remove route:   ' + route)
							console.log('route.remove route:   ');
							route.remove({},function(err) {
								if(err){				
									console.log('removing user routes error:   ' + err)
								} 
								else {
									console.log('user routes removed OK')
								}
							})
						}
					});	
					*/
				} 
				else {
				console.log('no user routes to remove');
				}
				
				
				user.remove({},function(err, user) {
					if(err){				
						console.log('err   ' + err)
						res.json({error :err});
					} 
					else {
						res.statusCode = 200;
						res.end();
						//res.json({status :'OK'}); 
						console.log('user deleted   ' + user.id)	
					}
				});
				
			}
		}
	});
});		

	


	
		
router.post('/', function(req, res) {	
	console.log('username :  ' + req.body.username);	
	console.log('password :   ' + req.body.password);		

	var user = new User({
		username : req.body.username,
		password: req.body.password
		});
	//	console.log("/users/:id     " +
	user.save(function (err) {
		if (!err) {
			console.info("New user created with id: %s", user.id);
			return res.json({ 
						data: outData.toJsonDeletePass(user) 
					});
		} else {
			if(err.name === 'ValidationError') {
				res.statusCode = 400;
				res.json({ 
					error: 'Validation error' 
				});
			} else {
				res.statusCode = 500;
				res.json({ 
					error: 'Server error' 
				});
			}
			console.error('Internal error(%d): %s', res.statusCode, err.message);
		}
	});

});



module.exports = router;