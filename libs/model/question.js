var mongoose = require('mongoose'),

	Schema = mongoose.Schema,

	Question = new Schema({
		"textDescription": { type: String },
		"type": { type: String },
		"imgUrl": { type: String },
		"imgId": { type: String },
		"answersAreImages": { type: Boolean },
		"imageIncluded": { type: Boolean },
		"textAnswer": { type: String },
		"allAnswers": {  type: Array }		
	});

module.exports = mongoose.model('Question', Question);
