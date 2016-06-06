var mongoose = require('mongoose'),
	crypto = require('crypto'),

	Schema = mongoose.Schema,

	TestImage = new Schema({		
		"url": { type: String },
		"testIds": { type: Array }
	});


module.exports = mongoose.model('TestImage', TestImage);
