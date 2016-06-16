var oauth2orize = require('oauth2orize');
var passport = require('passport');
var crypto = require('crypto');

var libs = process.cwd() + '/libs/';

var config = require(libs + 'config');
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var User = require(libs + 'model/user'); /////   check
var AccessToken = require(libs + 'model/accessToken');
var RefreshToken = require(libs + 'model/refreshToken');

var util = require('util');

// create OAuth 2.0 server
var aserver = oauth2orize.createServer();

// Generic error handler
var errFn = function (cb, err) {
	if (err) { 
		return cb(err); 
	}
};

// Destroys any old tokens and generates a new access and refresh token
var generateTokens = function (data, userInfo, done) {
	//console.log('generateTokens----------');
	// curries in `done` callback so we don't need to pass it
    var errorHandler = errFn.bind(undefined, done), 
	    refreshToken,
	    refreshTokenValue,
	    token,
	    tokenValue;

	tokenValue = crypto.randomBytes(32).toString('hex');
    refreshTokenValue = crypto.randomBytes(32).toString('hex');	
	
    RefreshToken.remove(data, function(error){
		if (error) {
			log.error(error);
    		return done(error); 
    	} else {
			data.token = refreshTokenValue;
			refreshToken = new RefreshToken(data);
			
			refreshToken.save(errorHandler);		
		}
	});
		
    AccessToken.remove(data, function(error){
		if (error) {
			log.error(error);
    		return done(error); 
    	} else {
			data.token = tokenValue;
			token = new AccessToken(data);	
			
			token.save(function (err, newToken) {			
				if (err) {
					log.error(err);
					return done(err); 
				}
				done(null, tokenValue, refreshTokenValue, { userId: data.userId, userData: userInfo,
					'expires_in': config.get('security:tokenLife') 
				});
			});
		}
	});
    

    

    
};

// Exchange username & password for access token.
aserver.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {
	//console.log("---------------exchange.password called");
	User.findOne({ username: username }, function(err, user) {
		
		if (err) { 
			return done(err); 
		}
		//console.log("oauth2orize.exchange  .password  " + password);
		if (!user || !user.checkPassword(password)) {
			return done(null, false);
		}

		var userInfo = {
			userRole: user.role || 'user',
			userLogin: user.username || 'user',
		};

		var model = { 
			userId: user.userId, 
			clientId: client.clientId 
		};

		generateTokens(model, userInfo, done);
	});

}));

// Exchange refreshToken for access token.
aserver.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done) {
	//console.log('-----------------exchange. refreshToken---');
	RefreshToken.findOne({ token: refreshToken, clientId: client.clientId }, function(err, token) {
		if (err) { 
			return done(err); 
		}

		if (!token) { 
			return done(null, false); 
		}

		User.findById(token.userId, function(err, user) {
			if (err) { return done(err); }
			if (!user) { return done(null, false); }
			
			var userInfo = {
				userRole: user.role || 'user',
				userLogin: user.username || 'user',
			};
			
			var model = { 
				userId: user.userId, 
				clientId: client.clientId 
			};

			generateTokens(model, userInfo, done);
		});
	});
}));

// token endpoint
//
// `token` middleware handles client requests to exchange authorization grants
// for access tokens.  Based on the grant type being exchanged, the above
// exchange middleware will be invoked to handle the request.  Clients must
// authenticate when making requests to this endpoint.

exports.token = [
	passport.authenticate(['basic','oauth2-client-password'], { session: false }),
	aserver.token(),
	aserver.errorHandler()
];
