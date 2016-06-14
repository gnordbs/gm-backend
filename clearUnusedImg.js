var libs = process.cwd() + '/libs/';

var log = require(libs + 'log')(module),
	db = require(libs + 'db/mongoose'),
    config = require(libs + 'config'),
	async = require('async'),
	fs = require('fs'),
	cron = require('node-cron');

var TestImage = require(libs + 'model/image');

console.log(new Date());

cron.schedule('15 0 * * *', function(){
	console.log(new Date());
	clearImages();
});

function clearImages(){
	TestImage.find({ 'testIds': [] }, function (err, unusedImgs) {
		if(err)	{
			log.error('Internal error(%d): %s', res.statusCode, err.message);	
		}
		if(unusedImgs){	
			if(unusedImgs.length){
				console.log("found %d images", unusedImgs.length);

				async.forEachOf(unusedImgs, function(item, index, callback){
						deleteImage(item, function(err){
							callback(err);
						})
					},
					function(err){				
						if(!err){
							console.log("successfully deleted");
						} else {
							console.log(err);	
							log.error('error: %s',err.message);
						}		
						//finishTask();
					}
				);
			} else {
				console.log("there is no unused images");
				//finishTask();	
			}
		} 
	  
	});
};

function deleteImage(imageToDel, callback){
	fs.unlink(imageToDel.url, function(err){
			if (err) throw err;	
	});
	imageToDel.remove({},function(err) {
		if(err){			
			callback(err);
		} else {
			if (typeof(callback) == "function"){
				callback(err);
			}
		}	
	});	
};

function finishTask(){
	setTimeout(function() {
		db.disconnect();
	}, 1000);	
}

