let express         = require('express');
let ParseServer     = require('parse-server').ParseServer;
let ParseDashboard  = require('parse-dashboard');
let path            = require('path');
const cron          = require('node-cron');
let moment          = require('moment');
let app             = express();
let Parse           = require('parse/node');
const resolve       = require('path').resolve;
let GCSAdapter      = require('@parse/gcs-files-adapter');

Parse.initialize(process.env.APP_ID || "JVQZMCuNYvnecPWvWFDTZa8A");
Parse.serverURL = process.env.SERVER_URL  || "http://localhost:1337/parse";

moment().format();

let databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) { 
  console.log('DATABASE_URI not specified, falling back to localhost.');
  databaseUri = 'mongodb://localhost:27017/weeclik'
}

let options = { allowInsecureHTTP: true };

let dashboard = new ParseDashboard({
  "apps": [
  {
    "serverURL":  process.env.SERVER_URL  || "http://localhost:1337/parse",
    "appId":      process.env.APP_ID      || "JVQZMCuNYvnecPWvWFDTZa8A",
    "masterKey":  process.env.MASTER_KEY  || "fUjUmsCLjd6fmsUQwXXHZJhd",
    "appName":    process.env.APP_NAME    || "weeclik"
  }],
  "users": [
  {
    "user":"adminUserWeeclik",
    "pass":"JVQZMCuNYHsdqJ726B_NkCGvWFDTZa8A"
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

let api = new ParseServer({
  databaseURI:        databaseUri,
  cloud:              process.env.CLOUD_CODE_MAIN     || __dirname + '/cloud/main.js',
  appId:              process.env.APP_ID              || 'JVQZMCuNYvnecPWvWFDTZa8A',
  masterKey:          process.env.MASTER_KEY          || 'fUjUmsCLjd6fmsUQwXXHZJhd',          //Add your master key here. Keep it secret!
  filesAdapter:       gcsAdapter,
  serverURL:          process.env.SERVER_URL          || 'http://localhost:1337/parse',       // Don't forget to change to https if needed
  verifyUserEmails:   process.env.VERIFY_USER_EMAILS  || true,
  publicServerURL:    process.env.PUBLIC_URL          || 'http://localhost:1337/parse',
  appName:            process.env.APP_NAME            || 'Weeclik',
  allowClientClassCreation: true,
  // Enable email verification
  // try to use this (avantage langue) // "@ngti/parse-server-mailgun": "^2.4.18",
  verifyUserEmails: true,
  emailAdapter: {
    module: 'parse-server-mailgun',
    options: {
      // The address that your emails come from
      fromAddress: 'Herrick de l\'équipe Weeclik <weeclik@gmail.comv>',
      // Your domain from mailgun.com
      domain: process.env.ADAPTER_DOMAIN          || 'sandboxcc19bbb77ec54953ad48a98f389b194b.mailgun.org',
      // Mailgun host (default: 'api.mailgun.net'). 
      // When using the EU region, the host should be set to 'api.eu.mailgun.net'
      host: 'api.eu.mailgun.net',
      // Your API key from mailgun.com
      apiKey: process.env.ADAPTER_API_KEY         || 'pubkey-82c8349ca08cef77e75a82a241b56500',
      // The template section
      templates: {
        passwordResetEmail: {
          subject: 'Reset your password',
          pathPlainText: resolve(__dirname, 'custom_email/password_reset/password_reset_email.txt'),
          pathHtml: resolve(__dirname, 'custom_email/password_reset/password_reset_email.html'),
          callback: (user) => { return { 
            name: user.get('name') 
          }}
          // Now you can use {{name}} in your templates
        },
        verificationEmail: {
          subject: 'Confirm your account',
          pathPlainText: resolve(__dirname, 'custom_email/verification_email/verification_email.txt'),
          pathHtml: resolve(__dirname, 'custom_email/verification_email/verification_email.html'),
          callback: (user) => { return { 
            name: user.get('name') 
          }}
          // Now you can use {{name}} in your templates
        },
        customEmailAlert: {
          subject: 'Urgent notification!',
          pathPlainText: resolve(__dirname, 'custom_email/custom_email.txt'),
          pathHtml: resolve(__dirname, 'custom_email/custom_email.html'),
          callback: (user) => { return { 
            name: user.get('name') 
          }}
          // Now you can use {{name}} in your templates
        }
      }
    }
  },
 /*emailAdapter: {
    module: 'parse-server-simple-mailgun-adapter',
    options: {
        // The address that your emails come from
        fromAddress:    process.env.ADAPTER_FROM_ADDRESS    || 'weeclik@gmail.com',
        // Your domain from mailgun.com
        domain:         process.env.ADAPTER_DOMAIN          || '<domain>.mailgun.org',
        // Your API key from mailgun.com
        apiKey:         process.env.ADAPTER_API_KEY         || 'key-<mailgun_API_key>',
    }
  },*/
/*
liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
}
*/
});

// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
let mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// make the Parse Dashboard available at /dashboard
app.use('/dashboard', dashboard);

let port = process.env.PORT || 1337;
let httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
  console.log('parse-server-example running on port ' + port + '.');
});

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

app.get('/valid_email/:email', (req, res) => {
  console.log(`Test address mail valid : ${req.params.email}`)
  let validator = require('mailgun-validate-email')('pubkey-82c8349ca08cef77e75a82a241b56500')
  validator(req.params.email, (err, result) => {
    if(err) {
      // TODO : Send Mail to admin for errors
      // email was not valid
      return res.statuts(400).send({
        success: 'false',
        message: 'Invalid mail or server error. Please contact admin fast.',
      })
    } else {
      // TODO: send admin email for high or medium risk emailss
      return res.status(200).send({
        success: 'true',
        message: result,
      });
    }
  })
});

// This will enable the Live Query real-time server
//ParseServer.createLiveQueryServer(httpServer);
