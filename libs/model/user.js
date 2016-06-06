var mongoose = require('mongoose'),
	crypto = require('crypto'),

	Schema = mongoose.Schema,

	User = new Schema({
		username: {
			type: String,
			unique: true,
			required: true
		},
		hashedPassword: {
			type: String,
			required: true,
			//select: false
		},
		salt: {
			type: String,
			required: true,
			//select: false
		},
		created: {
			type: Date,
			default: Date.now
		},
		driveRoute: {  type: Array },
		
	});

User.methods.encryptPassword = function(password) {
	console.log("encryptPassword called pass :"  + password);
	return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
    //more secure - return crypto.pbkdf2Sync(password, this.salt, 10000, 512).toString('hex');
};

User.virtual('userId')
.get(function () {
	return this.id;
});

User.virtual('password')
	.set(function(password) {
		this._plainPassword = password;
		this.salt = crypto.randomBytes(32).toString('hex');
		        //more secure - this.salt = crypto.randomBytes(128).toString('hex');
		        this.hashedPassword = this.encryptPassword(password);
		    })
	.get(function() { return this._plainPassword; });


User.methods.checkPassword = function(password) {
	return this.encryptPassword(password) === this.hashedPassword;
};

User.methods.deleteRouteId = function(routeId) {
	var index = this.driveRoute.indexOf(routeId);
	if (index >= 0) {
		console.log("index.index "   + index)
		var driveRouteUpd = this.driveRoute.splice(this.driveRoute.indexOf(routeId), 1);
		console.log("this.driveRoute 1    " + driveRouteUpd);
		return this.save({'driveRoute': driveRouteUpd}, function(err){
				console.log("this.driveRoute 2    " + this.driveRoute);
				console.log("err.err "   + err)
				if(err) return false;
				else return true;
			})
	} else return false;
};

User.methods.toJsonDeletePass = function() {
	var user = this.toObject();
	delete user.username;
	delete user.salt;
	delete user.hashedPassword;
	return user;
};

module.exports = mongoose.model('User', User);
