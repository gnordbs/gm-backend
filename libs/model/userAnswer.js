var mongoose = require('mongoose'),
	crypto = require('crypto'),

	Schema = mongoose.Schema,

	UserAnswer = new Schema({	
		"testId": { type: String },
		"userId": { type: String },		
		"name": { type: String },
		"surname": { type: String },
		"phone": { type: String },
		"email": { type: String },
		"rating": { type: String },
		"answers": { type: Array },
	});


module.exports = mongoose.model('UserAnswer', UserAnswer);
