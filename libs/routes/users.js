var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var User = require(libs + 'model/user');
//var DriveRoute = require(libs + 'model/driveroute');
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

/*
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


*/
/*
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

*/	


	
		
router.post('/', function(req, res) {	
	//console.log('username :  ' + req.body.username);	
	//console.log('password :   ' + req.body.password);		

	var user = new User({
		username : req.body.username,
		password: req.body.password,
		firstName:  req.body.firstName,
		lastName:  req.body.lastName,
		phone:  req.body.phone,
		email:  req.body.email,
		role: 'user'
	});
	
	
	User.findOne({username : req.body.username}, function(err, results) {
        if(err) {
            res.statusCode = 500;
			res.end();
        } else if(results) {
		
			res.statusCode = 409;
			res.json({error: "username not unique"});		
			
        } else {
            user.save(function (err, Usr) {
				if (!err) {
					console.info("New user created with id: %s", user.id);
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
        }
    });
	
	

});



module.exports = router;