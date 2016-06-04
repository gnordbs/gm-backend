var mongoose = require('mongoose'),
	crypto = require('crypto'),

	Schema = mongoose.Schema,

	Statistics = new Schema({	
		"testId": { type: String },		
		"testName": { type: String },	
		"userAnswers": {  type: Array },
		"questions": {  type: Array }		
	});


module.exports = mongoose.model('Statistics', Statistics);
