var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var User = require(libs + 'model/user');

var outData = require(libs + 'handle/data');
var util = require('util');



		
router.post('/', function(req, res) {	
	
	var userData = req.body.userData;
	
	verifyUserData(userData, function(status){
		if(status === 'ok'){
			
			var user = new User({
				username : userData.username,
				password: userData.password,
				firstName: userData.firstName,
				lastName: userData.lastName,
				phone: userData.phone,
				email: userData.email,
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
		} else {
			res.status(400).send({ error: status});	
		}
	});
});

function verifyUserData(userData, callback){
	var status = "";
	
	if(userData){
			
		if(!userData.username) {
			status += "Username is empty. ";	
		} else {
			if(userData.username.length > 30){
				status += "Username is too long. ";	
			}	
		}
			
		if(!userData.password) {
			status += "Password is empty. ";	
		} else {
			if(userData.password.length > 30){
				status += "Password is too long. ";	
			} else if(userData.password.length < 3){
				status += "Password is too short. ";	
			} 
		}	
		
		var nameRegexp = /[0-9]/;
		if(!userData.firstName) {
			status += "First Name is empty. ";	
		} else {
			if(userData.firstName.length > 30){
				status += "First Name is too long. ";	
			}	
			if(userData.firstName.match(nameRegexp)){
				status += "First Name should not have numbers. ";	
			}		
		}
		
 
		if(!userData.lastName) {
			status += "Last Name is empty. ";	
		} else {
			if(userData.lastName.length > 30){
				status += "Last Name is too long. ";	
			}	
			if(userData.lastName.match(nameRegexp)){
				status += "Last Name should not have numbers. ";	
			}		
		}
 
		var numberRegexp = /^([0-9()-]*)$/;	
		if(!userData.phone) {
			status += "Phone is empty. ";	
		} else {
			if(userData.phone.length > 30){
				status += "Phone is too long. ";	
			}	
			if(!userData.phone.match(numberRegexp)){
				status += "Phone should have only numbers. ";	
			}		
		}
		
	
		var emailRegexp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if(!userData.email) {
			status += "Email is empty. ";	
		} else if(!emailRegexp.test(userData.email)){
			status += "Email is not valid. ";					
		}
		
		if(status == ""){
			status = 'ok';	
		}
			
		if (typeof(callback) == "function"){
			callback(status);
		}			
	} else {
		if (typeof(callback) == "function"){
			callback('no user data');
		}
	}		
};


module.exports = router;