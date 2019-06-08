require('dotenv').config({ debug: process.env.DEBUG })

let express         = require('express');
let ParseServer     = require('parse-server').ParseServer;
let ParseDashboard  = require('parse-dashboard');
let path            = require('path');
const cron          = require('node-cron');
let moment          = require('moment');
let app             = express();
let Parse           = require('parse/node');
const resolve       = require('path').resolve;
const createError   = require('http-errors'); // Gestion des erreurs
const bodyParser    = require('body-parser'); // Parse incoming request bodies
let GCSAdapter      = require('@parse/gcs-files-adapter');
let mailgun         = require('mailgun-js')({apiKey: process.env.ADAPTER_API_KEY, domain: process.env.ADAPTER_DOMAIN, host: 'api.eu.mailgun.net'});

Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

// Configuration Server
app.use(bodyParser.json({ type: 'application/json' }));

moment().format();

let databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) { 
  console.log('DATABASE_URI not specified, falling back to localhost.');
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
    "user":process.env.ADMIN_USER,
    "pass":process.env.ADMMIN_PASSWORD
  }]
}, options);

let gcsOptions = {
  "projectId": "weeclik-1517332083996",
  "keyFilename": resolve(__dirname, "WeeClik-813d8719632d.json"),
  "bucket": "weeclik-1517332083996.appspot.com",
  "bucketPrefix": '',
  "directAccess": false
}
let gcsAdapter = new GCSAdapter(gcsOptions);

console.log(process.env.MASTER_KEY)

let api = new ParseServer({
  databaseURI:        databaseUri,
  cloud:              process.env.CLOUD_CODE_MAIN     || __dirname + '/cloud/main.js',
  appId:              process.env.APP_ID,
  masterKey:          process.env.MASTER_KEY,
  filesAdapter:       gcsAdapter,
  serverURL:          process.env.SERVER_URL,
  publicServerURL:    process.env.PUBLIC_URL,
  appName:            process.env.APP_NAME,
  allowClientClassCreation: true,
  // Enable email verification
  // try to use this (avantage langue) // "@ngti/parse-server-mailgun": "^2.4.18",
  verifyUserEmails: process.env.VERIFY_USER_EMAILS || true,
  emailAdapter: {
    module: 'parse-server-mailgun',
    options: {
      // The address that your emails come from
      fromAddress: 'Herrick de l\'équipe Weeclik <contact@herrick-wolber.fr>',
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
          subject: 'Reset your password',
          pathPlainText: resolve(__dirname, 'email_templates/password_reset/password_reset_email.txt'),
          pathHtml: resolve(__dirname, 'email_templates/password_reset/password_reset_email.html'),
          callback: (user) => { return { 
            name: user.get('name') 
          }}
          // Now you can use {{name}} in your templates
        },
        verificationEmail: {
          subject: 'Confirm your account',
          pathPlainText: resolve(__dirname, 'email_templates/verification_email/verification_email.txt'),
          pathHtml: resolve(__dirname, 'email_templates/verification_email/verification_email.html'),
          callback: (user) => { return { 
            name: user.get('name') 
          }}
          // Now you can use {{name}} in your templates
        },
        customEmailAlert: {
          subject: 'Urgent notification!',
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

// Serve the Parse API on the /parse URL prefix
let mountPath = process.env.PARSE_MOUNT;
app.use(mountPath, api);

// make the Parse Dashboard available at /dashboard
app.use('/dashboard', dashboard);

let port = process.env.PORT || 1337;
let httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
  console.log('Running weekclik server on port ' + port);
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
cron.schedule('0 * * * *', () => {
  // Chaque heure à 0 (01:00, 15:00, etc)
  // TODO: Ecrire fonction pour ecriture de log
  // TODO: Envoi de mail à chaque commerce passant en mode desactivé (user & admin)
  console.log(`Function executé à ${moment()}`)
  Parse.Cloud.run('retrieveAllObjects', { object_type: "Commerce", only_objectId: false })
  .then((objects) => {
    console.log("Successfully retrieved " + objects.length + " commerces.");
    for (let i = 0; i < objects.length; i++) {
      let object = objects[i];
      if (object.get('endSubscription') !== undefined) {
        if (moment(object.get('endSubscription')).isValid()) {
          let day =  moment(object.get('endSubscription'))
          if (moment().isSameOrAfter(day)) {
            console.log(object.get('nomCommerce') +  ' passed date')
            object.set("statutCommerce", 0)
            object.save()
          }
        }
      }
    }
  });
});

app.get('/cgu/', (req, res) => {
  return res.status(200).send('cgu')
})

app.get('/politique-confidentialite/', (req, res) => {
  return res.status(200).send('politique-confidentialite')
})

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

app.get('/valid_email/:email', (req, res) => {
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
