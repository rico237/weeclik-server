// TODO: After save on video to generate video thumbnail & description as 'video presentation {{ nom_du_commerce }}'
// TODO: Devide cloud code into multiple controller class, like Commerce.js (before, after and webhooks)

var NodeGeocoder = require('node-geocoder');
var geocoder = NodeGeocoder({
    provider: 'openstreetmap',
    httpAdapter: 'https',
    formatter: null
});

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

Parse.Cloud.define('nullPosition', async (request) => {
    const query = new Parse.Query("Commerce");
    query.equalTo("position", new Parse.GeoPoint({latitude: 0.0, longitude: 0.0}) );             // Status of commerce == paid
    const result = await query.find();
    return result;
});

Parse.Cloud.afterSave(Parse.User, (request) => {
    const parseObject   = request.object;
    const partagesIds   = parseObject.get("mes_partages");

    // Set mespartages to empty arrays if null
    if (partagesIds === undefined || partagesIds === null || typeof partagesIds === 'undefined')  {
        parseObject.set("mes_partages", []);
        parseObject.set("mes_partages_dates", []);
    }
});

Parse.Cloud.afterSave("Commerce", (request) => {
    const parseObject   = request.object;
    const description   = parseObject.get("description");
    const brouillon     = parseObject.get("brouillon");
    const position      = parseObject.get("position");
    const endOfPayment  = parseObject.get("endedSubscription");

    if (typeof position === 'undefined' || position === undefined || position === null || (position.latitude === 0 && position.longitude === 0)) {
        const address = parseObject.get("adresse");
        geocoder.geocode(address)
                .then(response => {
                    const responseArray = JSON.parse(JSON.stringify(response));
                    if (responseArray.length !== 0) {
                        const firstResponse = responseArray[0];
                        
                        parseObject.set("position", new Parse.GeoPoint({
                            latitude: firstResponse.latitude, 
                            longitude: firstResponse.longitude
                        }));
                    }
                })
                .catch(error => { console.log(error); });
    }

    // Set blank and empty values
    if (brouillon === undefined || brouillon === null || typeof brouillon === 'undefined')  {
        request.object.set("brouillon", true);
    }
    if (endOfPayment === undefined || endOfPayment === null || typeof endOfPayment === 'undefined')  {
        parseObject.set("endedSubscription", new Date());
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