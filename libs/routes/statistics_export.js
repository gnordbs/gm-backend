var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var Statistics = require(libs + 'model/Statistics');
var UserAnswer = require(libs + 'model/userAnswer');
var outData = require(libs + 'handle/data');
var crypto = require('crypto');

var excel = require('node-excel-export');
var fs = require('fs');


router.get('/',  function(req, res) {
	
});


router.get('/:id', authenticateAdmin, function(req, res) {
//router.get('/:id', passport.authenticate('bearer', { session: false }), function(req, res) {
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
					
					data.users = queryUserAnswer;
						
					var file = buildExcel(data);
					saveReport(file, function(err, filePath){
						if(!err){
							res.statusCode = 200;
							res.json({reportLink: filePath});						
						} else { 					
							res.statusCode = 500;
							res.end();	
							log.error('Internal error(%d): %s',res.statusCode,err.message);	
						}
					});	
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

function authenticateAdmin(req, res, next){
	passport.authenticate('bearer_admin', { session: false }, function(err, user, info) {	
		if (err) { 
			res.set('WWW-Authenticate', err);
			res.statusCode = 401;
			res.json(err);	
		} else if (!user) {
			var error = getErrObjectFromInfo(info);
			res.set('WWW-Authenticate', info);
			res.statusCode = 401;
			res.json(error);	
		} else {
			next();	
		}
	})(req, res);	
};

function getErrObjectFromInfo(info){
	if(info){
		var data = info.split(',');
		var error = {};
		
		data.forEach(function(item){	
				if(item.indexOf("error_description") > -1){		
				error.error_description = item.substring(item.indexOf('"')+1,item.lastIndexOf('"'));	
			} else if(item.indexOf("error") > -1){
				error.error = item.substring(item.indexOf('"')+1,item.lastIndexOf('"'));	
			}
		});	
		return error;
	} else {
		return "";	
	}
};






function buildExcel(data){

	var styles = {
		headerDark: {
			fill: {
				fgColor: {
					rgb: 'CFD8DC'
				}
			},
			font: {
				color: {
					rgb: '000000'
				},
				sz: 14,
				bold: true
			}
		}
	};
	
	var specification = {
		user_name: { 
			displayName: 'Name',
			headerStyle: styles.headerDark,
			width: 150 
		},
		user_lastname: {
			displayName: 'Surname',
			headerStyle: styles.headerDark,
			width: 150
		},
		user_phone: {
			displayName: 'Phone',
			headerStyle: styles.headerDark,
			width: 150 
		},
		user_email: {
			displayName: 'Email',
			headerStyle: styles.headerDark,
			width: 150 
		}
	}
	
	if(data && data.questions){
		data.questions.forEach(function(item){		
			specification[item.shortId] = {
				displayName: item.name,
				headerStyle: styles.headerDark,
				width: 50 
			}
		});
	}
	
	var dataset = [];
	
	if(data && data.users){
		data.users.forEach(function(item){	
			var userRow = {user_name: item.name, user_lastname: item.surname, user_phone: item.phone, user_email: item.email};
			
			item.answers.forEach(function(answer, i, arr){
				userRow[answer.shortId] = answer.isCorrect ? '+' : '-';
			});
			dataset.push(userRow);
		});
	}
	
	var report = excel.buildExport([ 
			{
				name: 'Results', 
				specification: specification, 
				data: dataset 
			}
		]
	);

	return report;
};

function saveReport(file, callback){
		
	var fileName = 'report_' + crypto.randomBytes(10).readUInt32LE(0)+'.xlsx';
	var filePath = "reports/" + fileName;
		
	fs.writeFile(filePath, file, function(err) {		
		if(err){
			callback(err, null);	
		} else {
			setTimeout(function() { 
				fs.unlink(filePath, function(err){
					if (err) throw err;	
				});
			}, 5 * 60 * 1000);	
				
			callback(err, filePath);	
		}
	}); 
}





module.exports = router;