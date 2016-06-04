var mongoose = require('mongoose');
var Schema = mongoose.Schema;



var test = new mongoose.Schema({
    "isAvailable": { type: Boolean },
    "availabilityText": { type: String },
    "testName": { type: String },
    "isPublic": { type: Boolean },
    "startDate": { type: Date, default: Date.now },
    "endDate": { type: Date, default: Date.now },
    "questions": {  type: Array }
});

module.exports = mongoose.model('Test',test,'test');;

