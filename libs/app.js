var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var methodOverride = require('method-override');

var libs = process.cwd() + '/libs/';
require(libs + 'auth/auth');

var config = require('./config');
var log = require('./log')(module);
var oauth2 = require('./auth/oauth2');

var api = require('./routes/api'); 
var admin_tests = require('./routes/admin_tests');
var admin_questions = require('./routes/admin_questions');
var tests = require('./routes/tests');
var questions = require('./routes/questions');
var Statistics = require('./routes/statistics');
var util = require('util');

var app = express();
////////////////////////////////////
///////////////////////////////////////

app.use(function(req, res, next) {
	method = req.method;
	console.log('get req.method' + method);
	//console.log(req.headers['Access-Control-Request-Headers']);
	//console.log(util.inspect(req.headers, {showHidden: false, depth: null}));
	//console.log(req.headers);
	res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
	console.log(req.headers['access-control-request-headers']);
    res.setHeader('Access-Control-Allow-Origin', '*');
	//res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200/about');
	//var AllowHeaders = req.header.Access-Control-Request-Headers;
	//console.log(AllowHeaders);
	//res.setHeader("Access-Control-Allow-Headers", AllowHeaders);
    //res.setHeader('Access-Control-Request-Headers','true');
	//res.addHeader("Access-Control-Allow-Headers", "Content-Type, authorization, Origin, X-Requested-With, Content-Type, Content-Range, Accept");
  	res.setHeader("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, Content-Type, Content-Range, Accept");
  	//res.setHeader('Access-Control-Allow-Headers', 'Origin, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token,Authorization');
	
	//res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Expose-Headers', 'X-Api-Version, X-Request-Id, X-Response-Time, X-Uid, X-Authentication');
	if ('OPTIONS' == req.method) {
      res.sendStatus(200);
    }
    else {
      next();
    }

});

//app.use(bodyParser.json({ type: 'application/vnd.api+json' }) ); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride());
app.use(passport.initialize());

app.use('/', api);
app.use('/api', api);
//app.use('/api/tests', tests);
app.use('/api/admin/test', admin_tests);
app.use('/api/admin/test/:id', admin_tests);
app.use('/api/admin/question/:id',admin_questions);
app.use('/api/admin/question', admin_questions);
app.use('/api/admin/statistics', Statistics);
app.use('/api/test', tests);
app.use('/api/question', questions);
app.use('/api/oauth/token', oauth2.token);

// catch 404 and forward to error handler
app.use(function(req, res, next){
    res.status(404);
    log.debug('%s %d %s', req.method, res.statusCode, req.url);
    res.json({ 
    	error: 'Not found' 
    });
    return;
});

// error handlers
app.use(function(err, req, res, next){
    res.status(err.status || 500);
    log.error('%s %d %s', req.method, res.statusCode, err.message);
    res.json({ 
    	error: err.message 
    });
    return;
});

module.exports = app;