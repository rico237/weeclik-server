Parse.Cloud.beforeSave("Commerce", (request, response) => {
 //  	const description = request.object.get("description");
	// var bannedWords = [
	// 	"au", "un", "une", "à", "il", "elle", "mais", "où", "est", "donc", "or", "ni", "car", " ",
	// 	"de", "la", "et", "du", "aux", "le", "se", "fait", "avec", "en", "des", "pas", "deux", 
	// ];

	// var sorted = [];
	// for (var i = 0; i < bannedWords.length; i++) {
	// 	var filtered = bannedWords[i].toLowerCase();
	//     sorted.push(filtered);
	// }
	// sorted.sort();

 //  	var hashtags = [];

	// let res = description.split(" ");

	// for (var i = 0; i < res.length; i++) {
	// 	let word = res[i].toLowerCase().replace(",","").replace(".", "");
	// 	if (!sorted.includes(word)) {
	// 		hashtags.push("#"+word);
	// 	}
	// }

 //  	request.object.set("tags", hashtags);
 //  	response.success();
});