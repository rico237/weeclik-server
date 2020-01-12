// require('dotenv').config({ 
//   debug: process.env.DEBUG,
//   path: 'dev.env'
// })
require('dotenv').config()

let express         = require('express');
let app             = express();

let ParseServer     = require('parse-server').ParseServer;
let ParseDashboard  = require('parse-dashboard');
let path            = require('path');
const cron          = require('node-cron');
let moment          = require('moment');
let Parse           = require('parse/node');
const resolve       = require('path').resolve;
const createError   = require('http-errors'); // Gestion des erreurs
const bodyParser    = require('body-parser'); // Parse incoming request bodies
let GCSAdapter      = require('@parse/gcs-files-adapter');
let mailgun         = require('mailgun-js')({apiKey: process.env.ADAPTER_API_KEY, domain: process.env.ADAPTER_DOMAIN, host: 'api.eu.mailgun.net'});
let MobileDetect    = require('mobile-detect');
const stripe        = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors          = require('cors');

// CORS origin = https://expressjs.com/en/resources/middleware/cors.html
// var whitelist = [
//   'http://localhost/', 
//   '127.0.0.1',
//   'https://weeclik-webapp.herokuapp.com/', 
//   'https://weeclik-webapp-dev.herokuapp.com/', 
//   'https://www.weeclik.com/'
// ]
// var corsOptions = {
//   origin: function (origin, callback) {
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       console.log(origin)
//       callback(new Error('Not allowed by CORS'));
//     }
//   }
// }

Parse.initialize(process.env.APP_ID, null, process.env.MASTER_KEY);
Parse.masterKey = process.env.MASTER_KEY;
Parse.serverURL = process.env.SERVER_URL;

// Configuration Server
app.use(bodyParser.json({ type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true }));

moment().format();

let databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) { 
  console.log('DATABASE_URI not specified, falling back to localhost.');
} else {
  console.log('DB URI: ' + databaseUri);
}

let options = { allowInsecureHTTP: true };

let dashboard = new ParseDashboard({
    "apps": [
    {
        "serverURL":  process.env.SERVER_URL,
        "appId":      process.env.APP_ID,
        "masterKey":  process.env.MASTER_KEY,
        "appName":    process.env.APP_NAME,
        "iconName": "logo.png",
        "supportedPushLocales": ["fr"]
    }],
    "iconsFolder": "icons",
    "users": [
    {
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

console.log(process.env.MASTER_KEY)

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

// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

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
httpServer.listen(port, function() {
  console.log('Running weeclik server on port ' + port);
});

app.get('/cgu/', (req, res) => {
    res.status(200).send('cgu')
})

app.get('/politique-confidentialite/', (req, res) => {
    res.status(200).send('politique-confidentialite')
})

// Toute les heure à 0 minute
// '* * 1 * *' tous les mois ?
// '* * * * *'
// cron.schedule('*/10 * * * * *', async () => {
cron.schedule('0 * * * *', async () => {
  // Chaque heure à 0 (01:00, 15:00, etc)
  // TODO: Ecrire fonction pour ecriture de log
  // TODO: Envoi de mail à chaque commerce passant en mode desactivé (user & admin)
  console.log(`Function executé à ${moment()}`);
  const commerces = await Parse.Cloud.run('endedSubscription');
  console.log("Successfully retrieved " + commerces.length + " commerces.");

  for (let i = 0; i < commerces.length; i++) {
    let object = commerces[i];
    if (moment(object.get('endSubscription')).isValid()) {
      let day =  moment(object.get('endSubscription'));
      if (moment().isSameOrAfter(day)) {
        console.log(object.get('nomCommerce') +  ' passed date');
        object.set("statutCommerce", 0);
        await object.save(null, {useMasterKey:true});
      }
    }
  }
});

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
        // TODO: rajouter un test sur le type d'erreur et retourner le bon type d'erreur
        return res.status(422).send({
            success: 'false',
            message: 'Missing parameter : content_message is undefined',
        })
    }
})

// Match the raw body to content type application/json
app.post('/webhook', (request, response) => {
    let event;
    try {event = request.body;}
    catch (err) {response.status(400).send(`Webhook Error: ${err.message}`);}
    console.log(event)
    // Handle the event
    switch (event.type) {
    case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        response.json({received: true, method : event.data.object});
        break;
    case 'payment_method.attached':
        response.json({received: true, method : event.data.object});
        break;
    case 'payment_intent.created':
        response.json({received: true, method : event.data.object});
        break;
    case 'charge.succeeded':
        response.json({received: true, method : event.data.object});
        break;
    default:
        // Unexpected event type
        console.log('Stripe event not handled by server')
        console.log(event.type)
        return response.status(400).end();
    }
  });

app.post("/charge", (req, res) => {    
    if (req.body.object === 'event') {return;}

    stripe.charges.create({
        amount: 32999,
        currency: "eur",
        description: "Abonnement annuel d'un commerce sur Weeclik (web & mobile)",
        source: req.body.token.id
    }).then(response => {
        res.json({ok: true, message: 'success', response: response});
    }).catch(error => {
        const message = error.type + ' : ' + error.message;
        console.log(message)
        switch (error.type) {
            case 'StripeCardError':
              // A declined card error
              error.message; // => e.g. "Your card's expiration year is invalid."
              break;
            case 'StripeInvalidRequestError':
                    error.message;
              // Invalid parameters were supplied to Stripe's API
              break;
            case 'StripeAPIError':
              // An error occurred internally with Stripe's API
              break;
            case 'StripeConnectionError':
              // Some kind of error occurred during the HTTPS communication
              break;
            case 'StripeAuthenticationError':
              // You probably used an incorrect API key
              break;
            case 'StripeRateLimitError':
              // Too many requests hit the API too quickly
              break;
          }
        res.status(500).json({ok: false, message: 'error', response: message});
    });
});

app.get('/valid-email/:email', (req, res) => {
    console.log(`Test address mail valid : ${req.params.email}`)
      // TODO: change
      let validator = require('mailgun-validate-email')(process.env.MAILGUN_PUBKEY)
      validator(req.params.email, (err, result) => {
          if(err) {
          // TODO : Send Mail to admin for errors
          // email was not valid
          // TODO: rajouter un test sur le type d'erreur et retourner le bon type d'erreur
          return res.status(400).send({
              success: 'false',
              message: 'Invalid mail or server error. Please contact admin fast.',
          })
      } else {
          // TODO: send admin email for high or medium risk email
          return res.status(200).send({
              success: 'true',
              message: result,
          });
      }
  })
  });

app.get('/redirect-to-store', (req, res) => {
    let md = new MobileDetect(req.headers['user-agent'])
    // TODO: [1] show a rendered html page for unknown devices
    // TODO: [2] Add can open url - deep linking / universal links (better for ios)
    // 
    // https://github.com/mderazon/node-deeplink
    // https://stackoverflow.com/questions/32689483/ios9-try-to-open-app-via-scheme-if-possible-or-redirect-to-app-store-otherwise/32774701#32774701
    // https://www.raywenderlich.com/6080-universal-links-make-the-connection
    
    // IF NOT A BOT
    if (!md.is('bot')) {
        if (md.phone() !== null || md.mobile() !== null) {
            console.log(`OS collected : ${md.os}`)
            if (md.os() === 'AndroidOS') {
                console.log('Android')
                return res.redirect(301, process.env.ANDROID_LINK);
            } else if (md.os() === 'iOS') {
                console.log('IOS')
                return res.redirect(301, process.env.IOS_LINK);
            } else {
                const data = {
                    from: 'Web server <no-reply@weeclik.com>',
                    to: 'contact@herrick-wolber.fr',
                    subject: 'redirect to store problem',
                    text: JSON.stringify(md)
                };

                mailgun.messages().send(data, (error, body) => {
                    console.log(body);
                });
                // HERE [1] 
                return res.status(200).send("Appareil iconnu")
            }
        } else {
            const data = {
                from: 'Web server <no-reply@weeclik.com>',
                to: 'contact@herrick-wolber.fr',
                subject: 'redirect to store problem',
                text: JSON.stringify(md)
            };

            mailgun.messages().send(data, (error, body) => {
                console.log(body);
            });

            console.log(JSON.stringify(md))
            // HERE [1] 
            return res.status(200).send(`L'appareil n'est pas un téléphone <br><br>${JSON.stringify(md)}`)
        }
    } 
})
