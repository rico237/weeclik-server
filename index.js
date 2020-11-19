require('dotenv').config({ path: './dev.env' });
// require('dotenv').config();

let express         = require('express');
let app             = express();

let ParseServer     = require('parse-server').ParseServer;
let ParseDashboard  = require('parse-dashboard');
let path            = require('path');
let moment          = require('moment');
let Parse           = require('parse/node');
const resolve       = require('path').resolve;
const bodyParser    = require('body-parser'); // Parse incoming request bodies
let GCSAdapter      = require('@parse/gcs-files-adapter');
let mailgun         = require('mailgun-js')({apiKey: process.env.ADAPTER_API_KEY, domain: process.env.ADAPTER_DOMAIN, host: 'api.eu.mailgun.net'});
const cors          = require('cors');

// Parse lib init
Parse.initialize(process.env.APP_ID, null, process.env.MASTER_KEY);
Parse.masterKey = process.env.MASTER_KEY;
Parse.serverURL = process.env.SERVER_URL;

// Configuration Server
app.use(bodyParser.json({ type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true }));

moment().format();

let databaseUri = process.env.DATABASE_URI;
if (!databaseUri) { 
	console.log('DATABASE_URI not specified, falling back to localhost.');
} else {
	console.log('DB URI: ' + databaseUri);
}

let options = { allowInsecureHTTP: true };
let dashboard = new ParseDashboard({
	"apps": [{
		"serverURL":  process.env.SERVER_URL,
		"appId":      process.env.APP_ID,
		"masterKey":  process.env.MASTER_KEY,
		"appName":    process.env.APP_NAME,
		"iconName": "logo.png",
		"supportedPushLocales": ["fr"]
	}],
	"iconsFolder": "icons",
	"users": [{
		"user": process.env.ADMIN_USER,
		"pass": process.env.ADMIN_PASSWORD
	}]
}, options);

let gcsOptions = {
	"projectId": "weeclik-1517332083996",
	"keyFilename": resolve(__dirname, "WeeClik-813d8719632d.json"),
	"bucket": "weeclik-1517332083996.appspot.com",
	"bucketPrefix": 'baas_files/',
	"directAccess": false
}
let gcsAdapter = new GCSAdapter(gcsOptions);
let api = new ParseServer({
	databaseURI:        databaseUri || 'mongodb://localhost:27017/weeclik',
	cloud:              process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
	appId:              process.env.APP_ID,
	masterKey:          process.env.MASTER_KEY,
	filesAdapter:       gcsAdapter,
	serverURL:          process.env.SERVER_URL,
	publicServerURL:    process.env.PUBLIC_URL,
	appName:            process.env.APP_NAME,
    maxUploadSize:      process.env.MAX_UPLOAD_SIZE || "1024mb", // 1024 MB = 1 Go
    allowClientClassCreation: true,
      // Enable email verification
      // try to use this (avantage langue) // "@ngti/parse-server-mailgun": "^2.4.18",
      verifyUserEmails: process.env.VERIFY_USER_EMAILS || true,
      emailAdapter: {
      	module: 'parse-server-mailgun',
      	options: {
          // The address that your emails come from
          fromAddress: 'Herrick de l\'équipe Weeclik <contact@weeclik.com>',
          // Your domain from mailgun.com
          domain: process.env.ADAPTER_DOMAIN,
          // Mailgun host (default: 'api.mailgun.net'). 
          // When using the EU region, the host should be set to 'api.eu.mailgun.net'
          host: 'api.eu.mailgun.net',
          // Your API key from mailgun.com
          apiKey: process.env.ADAPTER_API_KEY,
          // The template section
          templates: {
          	passwordResetEmail: {
          		subject: 'Mot de passe oublié ?',
          		pathPlainText: resolve(__dirname, 'email_templates/password_reset/password_reset_email.txt'),
          		pathHtml: resolve(__dirname, 'email_templates/password_reset/password_reset_email.html'),
          		callback: (user) => { return { 
          			name: user.get('name') 
          		}}
                  // Now you can use {{name}} in your templates
              },
              verificationEmail: {
              	subject: 'Bienvenue dans la famille Weeclik',
              	pathPlainText: resolve(__dirname, 'email_templates/verification_email/verification_email.txt'),
              	pathHtml: resolve(__dirname, 'email_templates/verification_email/verification_email.html'),
              	callback: (user) => { return { 
              		name: user.get('name') 
              	}}
                  // Now you can use {{name}} in your templates
              },
              customEmailAlert: {
              	subject: 'Message urgent',
              	pathPlainText: resolve(__dirname, 'email_templates/custom_email/custom_email.txt'),
              	pathHtml: resolve(__dirname, 'email_templates/custom_email/custom_email.html'),
              	callback: (user) => { return { 
              		name: user.get('name') 
              	}}
                  // Now you can use {{name}} in your templates
              }
          }
      }
  }
});
// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));
app.get('/apple-app-site-association', (req, res) => {
	res.status(200).sendFile(path.join(__dirname, 'apple-app-site-association'));
});

// Serve the Parse API on the /parse URL prefix
let mountPath = process.env.PARSE_MOUNT;
app.use(mountPath, api);

// make the Parse Dashboard available at /dashboard
app.use('/dashboard', dashboard);

// Allow all cors origin
app.use(cors());

let port = process.env.PORT || 1337;
let httpServer = require('http').createServer(app);
httpServer.listen(port, () => { console.log('Running weeclik server on port ' + port); });

// Import routes
require('./routes/stripe')(app);
// Cron tasks (repetitive tasks)
require('./cron/cron')(app);

app.post('/send-error-mail', (req, res) => {
	console.log(req.body);
	if (req.body.content_message) {
		const data = {
			from: 'iOS APP <no-reply@weeclik.com>',
			to: 'contact@herrick-wolber.fr',
			subject: 'Error in iOS App',
			text: req.body.content_message
		};

		mailgun.messages().send(data, (error, body) => {
			if (error) {
				return error
			} else {
				return res.status(200).send({
					success: 'true',
					message: 'Message envoyé avec succès',
				});
			}
			console.log(body);

		});
	} else {
	    return res.status(422).send({
	    	success: 'false',
	    	message: 'Missing parameter : content_message is undefined'
	    })
	}
});

// Match the raw body to content type application/json
// app.post('/webhook', (request, response) => {
// 	let event;
// 	try {event = request.body;}
// 	catch (err) {response.status(400).send(`Webhook Error: ${err.message}`);}
// 	console.log(event)
//     // Handle the event
//     switch (event.type) {
//     	case 'payment_intent.succeeded':
//     	const paymentIntent = event.data.object;
//     	response.json({received: true, method : event.data.object});
//     	break;
//     	case 'payment_method.attached':
//     	response.json({received: true, method : event.data.object});
//     	break;
//     	case 'payment_intent.created':
//     	response.json({received: true, method : event.data.object});
//     	break;
//     	case 'charge.succeeded':
//     	response.json({received: true, method : event.data.object});
//     	break;
//     	default:
//         // Unexpected event type
//         console.log('Stripe event not handled by server')
//         console.log(event.type)
//         return response.status(400).end();
//     }
// });

app.post("/share", (req, res) => {    
	console.log("/share commerce endpoint");
	console.log("User: "+ req.body.userId + " is sharing commerce: " + req.body.commerceId);
	const commerceId = req.body.commerceId;
	const userId = req.body.userId;

	if (commerceId) {
		var query = new Parse.Query(Parse.Object.extend("Commerce"));
		query.get(commerceId).then((commerce) => {
			commerce.increment("nombrePartages");
			commerce.save(null, {useMasterKey: true}).then((commerceSaved) => {
				// Fetch user
				if (userId) {
					var userQuery = new Parse.Query(Parse.User);
					userQuery.get(userId).then((user) => {
						// TODO: check if values are nil
						var shares = user.get("mes_partages");
						if (shares === undefined || shares === null || typeof shares === 'undefined') {
							// Date is null
							user.set("mes_partages", []);
							user.set("mes_partages_dates", []);
						} else {
							// Data already exists
							user.add("mes_partages", commerce.id);
							user.add("mes_partages_dates", new Date());
						}

						user.save(null, {useMasterKey: true}).then((user) => {
							return res.status(200).send({ message: 'Sharing of commerce: '+ commerceId + 'has been done successfully by user: '+ userId });
						}, (errorSavingUser) => {
							return res.status(402).send({ error: 'Updating of user did fail. Original error => '+ errorSavingUser.message });
						});
					}, (userError) => {
						return res.status(404).send({ error: 'User not found. Original error => '+ userError.message });
					});
				} else {
					return res.status(200).send({ message: 'Sharing of commerce: '+ commerceId + 'has been done successfully' });
				}
				
			}, (savingError) => {
				return res.status(401).send({ error: 'Updating of commerce did fail. Original error => '+ errorSavingUser.message });
			});
		}, (commerceError) => {
			return res.status(403).send({ error: 'Commerce not found. Original error => '+ commerceError.message });
		});
	} else {
		return res.status(400).send({ error: 'missing commerce id parameter' });
	}

});
