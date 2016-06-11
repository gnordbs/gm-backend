exports.testlistToJson = function (list) {
	//var routes1 = routes.toArray();
	//var routes1 = JSON.stringify(routes);
		
	var newlist = list.map(function(item, i, arr){
		var newitem = {};	
			
		newitem.isAvailable =  true,
		newitem.availabilityText = '',
		newitem.testName = item.testName,
		newitem.isPublic = item.isPublic,
		newitem.startDate =item.startDate,
		newitem.endDate = item.endDate,
		newitem.questions = item.questions;
		newitem.id = item._id;

		return newitem;	
	});

	return newlist;	
};

exports.testToJson = function (item) {
	//var routes1 = routes.toArray();
	//var routes1 = JSON.stringify(routes);
		
	//console.log("item..................",item);
	var newitem = {};	
		
	newitem.isAvailable = item.isAvailable,
	newitem.availabilityText = item.availabilityText,
	newitem.testName = item.testName,
	newitem.isPublic = item.isPublic,
	newitem.startDate =item.startDate,
	newitem.endDate = item.endDate,
	newitem.questions = item.questions;
	newitem.id = item._id;
	//console.log("newitem..................",newitem);
	return newitem;	

};

exports.userStatsToJson = function (list) {
		
	var newlist = list.map(function(item, i, arr){
		var newitem = {	
			"testId": item.testId,		
			"name": item.name,
			"surname": item.surname,
			"phone": item.phone,
			"email": item.email,
			"rating": item.rating,
		};
		
		item.answers.forEach(function(answer, i, arr){
			newitem[answer.qId] = answer.isCorrect;
		});
		
		return newitem;	
	});
	
	return newlist;	
};

exports.questionUserJson = function (item) {
	//var routes1 = routes.toArray();
	//var routes1 = JSON.stringify(routes);
		
	
		
		var newitem = {	
			"id":item.id,
			"textDescription": item.textDescription,
			"type": item.type,
			"imgUrl": item.imgUrl,
			"imgId":item.imgId,
			"answersAreImages": item.answersAreImages,
			"imageIncluded": item.imageIncluded,
			"textAnswer": "",
		};	
			
		newitem.allAnswers = item.allAnswers.map(function(answer, i, arr){
			var newAnswer = {
				"text": answer.text,
				"imgId": answer.imgId,
				"imgUrl": answer.imgUrl,
				"isDefault": false,
				"isTrue": false
			};
			return newAnswer;
		});
		
		return newitem;	

};

exports.removeValueFromArray = function (arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}