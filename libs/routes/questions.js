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

/*
router.get('/:id',  function(req, res) {
	Question.findById(req.params.id, function (err, oneQuestion) {
		
		if(!oneQuestion) {
			res.statusCode = 404;
			res.end();
			//return res.json({ 
			//	error: 'Not found' 
			//});
		} else if (!err) {
			return res.json(outData.questionUserJson(oneQuestion));	
			//return res.json(outData.routesToJsonV_1(oneTest));
		} else {
			res.statusCode = 500;
			res.end();
			log.error('Internal error(%d): %s',res.statusCode,err.message);
		}
	});
});
*/

module.exports = router;