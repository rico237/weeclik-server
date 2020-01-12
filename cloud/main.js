// TODO: After save on video to generate video thumbnail & description as 'video presentation {{ nom_du_commerce }}'
// TODO: Devide cloud code into multiple controller class, like Commerce.js (before, after and webhooks)

// Clear associated photos & videos of a commerce when deleted
Parse.Cloud.afterDelete("Commerce", (request) => {
    const commerce = request.object;

    // 1 - Get all photos => delete them all
    const Commerce_Photos = Parse.Object.extend("Commerce_Photos");
    const queryPhotos = new Parse.Query(Commerce_Photos);
    queryPhotos.equalTo("commerce", commerce);
    queryPhotos.find().then(photos => {
        Parse.Object.destroyAll(photos).then(() => {
            console.log("Photos deleted with success");
        })
        .catch(error => {
            if (error.code === Parse.Error.AGGREGATE_ERROR) {
                for (var i = 0; i < error.errors.length; i++) {
                    console.log("Couldn't delete " + error.errors[i].object.id +
                    "due to " + error.errors[i].message);
                }
            } else {
                console.log("Delete aborted because of " + error.message);
            }
        });
    })
    .catch((error) => {
        console.error("Error finding related photos " + error.code + ": " + error.message);
    });
    // 2 - Get all videos => delete them all
    const Commerce_Videos = Parse.Object.extend("Commerce_Videos");
    const queryVideos = new Parse.Query(Commerce_Videos);
    queryPhotos.equalTo("leCommerce", commerce);
    queryVideos.find().then(videos => {
        Parse.Object.destroyAll(videos).then(() => {
            console.log("Videos deleted with success");
        })
        .catch(error => {
            if (error.code === Parse.Error.AGGREGATE_ERROR) {
                for (var i = 0; i < error.errors.length; i++) {
                    console.log("Couldn't delete " + error.errors[i].object.id +
                    "due to " + error.errors[i].message);
                }
            } else {
                console.log("Delete aborted because of " + error.message);
            }
        });
    })
    .catch((error) => {
        console.error("Error finding related videos " + error.code + ": " + error.message);
    });
});

// Parse.Cloud.beforeSave("Commerce", (request) => {
//     const parseObject = request.object;
//     if ( parseObject.getPublicWriteAccess() ) {throw "The public is allowed to change this object, please set the proper ACL";}
// });

Parse.Cloud.afterSave("Commerce", (request) => {
    const parseObject   = request.object;
    const description   = parseObject.get("description");
    const brouillon     = parseObject.get("brouillon");
    const nomCommerce   = parseObject.get("nomCommerce"); //TODO: changer le nom de la description de la video

    // Set blank and empty values
    if (brouillon === undefined || brouillon === null || typeof brouillon === 'undefined') 
    {request.object.set("brouillon", true);}

    if (description !== undefined || description !== "" || typeof description !== 'undefined') {
        var bannedWords = [
        "au", "un", "une", "à", "il", "elle", "ils", "elles", "mais", "où", "est", "donc", "or", "ni", "car", " ",
        "de", "la", "et", "du", "aux", "le", "se", "fait", "avec", "en", "des", "pas", "deux", "\n",
        "\t", "\n\t", "<br>", "<br/>", "<br />", "l", "a", "n", "test", "description", "sappuie", "sur", "pour",
        "les", "proposer", "très"
        ];

        var sorted = [];
        for (var i = 0; i < bannedWords.length; i++) {
            var filtered = bannedWords[i].toLowerCase();
            sorted.push(filtered);
        }
        sorted.sort();

        var hashtags = [];

        if (typeof description.split(" ") !== 'undefined') {
            let res = description.split(" ");

            for (var i = 0; i < res.length; i++) {
                let word = res[i].toLowerCase().replace(",","").replace(".","").replace(";","").replace("'", "");
                if (!sorted.includes(word)) {
                    hashtags.push("#"+word);
                    console.log("Word tags");
                    console.log(word);
                }
            }

            request.object.set("tags", hashtags);
        }
    }
});

Parse.Cloud.define('endedSubscription', async (request) => {
    const query = new Parse.Query("Commerce");

    query.exists("endSubscription");                // End of subscription is not null
    query.lessThan("endSubscription", new Date());  // Current date is after subscription date 
    query.equalTo("statutCommerce", 1);             // Status of commerce == paid

    const result = await query.find();
    return result;
});

// Parse.Cloud.define("retrieveAllObjects", (request) => {
//     var result     = [];
//     var chunk_size = 1000;
//     var processCallback = (res) => {
//         result = result.concat(res);
//         console.log(result)
//         if (res.length === chunk_size) {
//             process(res[res.length-1].id);
//         } else {
//             console.log(result)
//             return result
//             // status.success(result);
//         }
//     };
//     var process = (skip) => {
//         var query = new Parse.Query(request.params.object_type);
//         if (skip) {
//             query.greaterThan("objectId", skip);
//         }
//         if (request.params.update_at) {
//             query.greaterThan("updatedAt", request.params.update_at);
//         }
//         if (request.params.only_objectId) {
//             query.select("objectId");
//         }
//         query.limit(chunk_size);
//         query.ascending("objectId");
//         query.find().then(res => {
//             console.log(res)
//             processCallback(res);
//         })
//         .catch(error => {
//             console.log(error)
//             status.error("query unsuccessful, length of result " + result.length + ", error:" + error.code + " " + error.message);
//         });
//     };
//     process(false);
// });

// Parse.Cloud.define("sendOutdatedEmail", (request) => {
//   // Get access to Parse Server's cache
//   const { AppCache } = require('parse-server/lib/cache');
//     // Get a reference to the MailgunAdapter
//     // NOTE: It's best to do this inside the Parse.Cloud.define(...) method body and not at the top of your file with your other imports. This gives Parse Server time to boot, setup cloud code and the email adapter.
//     const MailgunAdapter = AppCache.get('JVQZMCuNYvnecPWvWFDTZa8A').userController.adapter;

//     // request.params.update_at

//     // Invoke the send method with an options object
//     MailgunAdapter.send({
//         templateName: 'customEmailAlert',
//       // Optional override of your configuration's subject
//       subject: 'Important: action required',
//       // Optional override of the adapter's fromAddress
//       fromAddress: 'Alerts <noreply@yourapp.com>',
//       recipient: 'user@email.com',
//       variables: { alert: 'New posts' }, // {{alert}} will be compiled to 'New posts'
//       // Additional message fields can be included with the "extra" option
//       // See https://nodemailer.com/extras/mailcomposer/#e-mail-message-fields for an overview of what can be included
//       extra: {
//           attachments: [], /* include attachment objects */
//           replyTo: 'reply-to-address'
//       }
//   });
// });