var faker = require('faker');

var libs = process.cwd() + '/libs/';

var log = require(libs + 'log')(module);
var db = require(libs + 'db/mongoose');
var config = require(libs + 'config');

var Test = require(libs + 'model/test');
var Question = require(libs + 'model/question');
var Statistics = require(libs + 'model/Statistics');
var TestImage = require(libs + 'model/image');
var UserAnswer = require(libs + 'model/userAnswer');

Test.remove({}, function (err) {
    if (err) {
        return log.error(err);
    }
});

Question.remove({}, function (err) {
    if (err) {
        return log.error(err);
    }
});

Statistics.remove({}, function (err) {
    if (err) {
        return log.error(err);
    }
});

TestImage.remove({}, function (err) {
    if (err) {
        return log.error(err);
    }
});

Test.remove({}, function (err) {
    if (err) {
        return log.error(err);
    }
});

UserAnswer.remove({}, function (err) {
    if (err) {
        return log.error(err);
    }
});


setTimeout(function() {
    db.disconnect();
}, 3000);