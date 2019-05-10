Parse.Cloud.beforeSave("Commerce", (request, response) => {
  	const description = request.object.get("description");
	var bannedWords = [
		"au", "un", "une", "à", "il", "elle", "mais", "où", "est", "donc", "or", "ni", "car", " ",
		"de", "la", "et", "du", "aux", "le", "se", "fait", "avec", "en", "des", "pas", "deux", "\n",
	];

	var sorted = [];
	for (var i = 0; i < bannedWords.length; i++) {
		var filtered = bannedWords[i].toLowerCase();
	    sorted.push(filtered);
	}
	sorted.sort();

  	var hashtags = [];

	let res = description.split(" ");

	for (var i = 0; i < res.length; i++) {
		let word = res[i].toLowerCase().replace(",","").replace(".", "");
		if (!sorted.includes(word)) {
			hashtags.push("#"+word);
		}
	}

  	request.object.set("tags", hashtags);
  	response.success();
});

Parse.Cloud.define("retrieveAllObjects", function(request, status) {
    var result     = [];
    var chunk_size = 1000;
    var processCallback = function(res) {
        result = result.concat(res);
        if (res.length === chunk_size) {
            process(res[res.length-1].id);
        } else {
            status.success(result);
        }
    };
    var process = function(skip) {
        var query = new Parse.Query(request.params.object_type);
        if (skip) {
            query.greaterThan("objectId", skip);
        }
        if (request.params.update_at) {
            query.greaterThan("updatedAt", request.params.update_at);
        }
        if (request.params.only_objectId) {
            query.select("objectId");
        }
        query.limit(chunk_size);
        query.ascending("objectId");
        query.find().then(function (res) {
            processCallback(res);
        }, function (error) {
            status.error("query unsuccessful, length of result " + result.length + ", error:" + error.code + " " + error.message);
        });
    };
    process(false);
});