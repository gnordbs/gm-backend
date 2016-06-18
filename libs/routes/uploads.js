var express = require('express'),
	passport = require('passport'),
	async = require('async'),
	router = express.Router(),
	fs = require('fs-extra'),
	formidable = require('formidable'),
	path = require('path');

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose'),
//var Test = require(libs + 'model/test');
	TestImage = require(libs + 'model/image'),
	outData = require(libs + 'handle/data'),
	util = require('util');

	
//router.post('/', passport.authenticate('bearer', { session: false }), function(req, res) {
router.post('/', function(req, res) {
	console.log('upload image');
	//console.log(req.files);
	//console.log('upload image----');
	
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
		//res.writeHead(200, {'content-type': 'text/plain'});
		//res.write('received upload:\n\n');
		//res.end(util.inspect({fields: fields, files: files}));
	});
	
	form.on('end', function(fields, files) {
			
		var verifyStatus = verifyImage(this.openedFiles[0]);
		
		if(verifyStatus === "ok"){			
			var timeInMs = Date.now();
			var extention = path.extname(this.openedFiles[0].name)

			var temp_path = this.openedFiles[0].path;
			var file_name = 'img_'+ timeInMs + extention;
			var new_location = 'images/';
			var new_path = new_location + file_name;
			
			fs.copy(temp_path, new_path, function(err) {  
				if (err) {
					console.error(err);
				} else {
						
					var newTestImage = new TestImage({	
						"url": new_path,
						"testIds": []
					});	
					
					newTestImage.save(function (err,savedImage) {
						if (!err) {							
							res.statusCode = 200;
							res.json({ 
								"id":savedImage.id
							});
							//return res.json(outData.routesToJsonV_1(savedTest));					
						} else {
							if(err.name === 'ValidationError') {////////////delete   !!!!!
								res.statusCode = 400;
								res.end();
							} else {
								res.statusCode = 500;
								res.end();
							}
							log.error('Internal error(%d): %s', res.statusCode, err.message);
						}
					});
						
				}
			});
		} else {
			res.statusCode = 415;
			res.json(verifyStatus);
			log.error('Not supported file type: %s', verifyStatus);
		}
	});

});

function verifyImage(file){
	var status = "ok";	
		
	if (file.type.match('image.*')) {
		if(file.size > 5242880){		
			status = "file is too big";			
		}
		
	} else {
		status = "chose image only";	
	}
	return status;
};




module.exports = router;