
// TODO: After save on video to generate video thumbnail & description as 'video presentation {{ nom_du_commerce }}'
// TODO: Devide cloud code into multiple controller class, like Commerce.js (before, after and webhooks)

Parse.Cloud.beforeSave("Commerce", async (request) => {
    const description = request.object.get("description");
    const brouillon   = request.object.get("brouillon");

    if (description !== undefined) {
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
    }

    if (brouillon === undefined || brouillon == null) {
        request.object.set("brouillon", true);
    }
});

Parse.Cloud.define("retrieveAllObjects", (request, status) => {
    var result     = [];
    var chunk_size = 1000;
    var processCallback = (res) => {
        result = result.concat(res);
        if (res.length === chunk_size) {
            process(res[res.length-1].id);
        } else {
            status.success(result);
        }
    };
    var process = (skip) => {
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
        query.find().then((res) => {
            processCallback(res);
        }, (error) => {
            status.error("query unsuccessful, length of result " + result.length + ", error:" + error.code + " " + error.message);
        });
    };
    process(false);
});

Parse.Cloud.define("sendOutdatedEmail", async (request) => {
  // Get access to Parse Server's cache
    const { AppCache } = require('parse-server/lib/cache');
    // Get a reference to the MailgunAdapter
    // NOTE: It's best to do this inside the Parse.Cloud.define(...) method body and not at the top of your file with your other imports. This gives Parse Server time to boot, setup cloud code and the email adapter.
    const MailgunAdapter = AppCache.get('JVQZMCuNYvnecPWvWFDTZa8A').userController.adapter;

    // request.params.update_at

    // Invoke the send method with an options object
    MailgunAdapter.send({
      templateName: 'customEmailAlert',
      // Optional override of your configuration's subject
      subject: 'Important: action required',
      // Optional override of the adapter's fromAddress
      fromAddress: 'Alerts <noreply@yourapp.com>',
      recipient: 'user@email.com',
      variables: { alert: 'New posts' }, // {{alert}} will be compiled to 'New posts'
      // Additional message fields can be included with the "extra" option
      // See https://nodemailer.com/extras/mailcomposer/#e-mail-message-fields for an overview of what can be included
      extra: {
        attachments: [], /* include attachment objects */
        replyTo: 'reply-to-address'
      }
    });
});