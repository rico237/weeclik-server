// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express         = require('express');
var ParseServer     = require('parse-server').ParseServer;
var ParseDashboard  = require('parse-dashboard');
var path            = require('path');
var app             = express();

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) { 
    console.log('DATABASE_URI not specified, falling back to localhost.');
}

var options = { allowInsecureHTTP: true };

var dashboard = new ParseDashboard({
  "apps": [
    {
      "serverURL":  process.env.SERVER_URL  || "http://localhost:1337/parse",
      "appId":      process.env.APP_ID      || "JVQZMCuNYvnecPWvWFDTZa8A",
      "masterKey":  process.env.MASTER_KEY  || "fUjUmsCLjd6fmsUQwXXHZJhd",
      "appName":    process.env.APP_NAME    || "weeclik"
    }
  ],
  "users": [
    {
      "user":"adminUserWeeclik",
      "pass":"JVQZMCuNYHsdqJ726B_NkCGvWFDTZa8A"
    },
  ]
}, options);

var api = new ParseServer({
    databaseURI:        databaseUri                     || 'mongodb://localhost:27017/weeclik',
    // cloud:              process.env.CLOUD_CODE_MAIN     || __dirname + '/cloud/main.js',
    appId:              process.env.APP_ID              || 'JVQZMCuNYvnecPWvWFDTZa8A',
    masterKey:          process.env.MASTER_KEY          || 'fUjUmsCLjd6fmsUQwXXHZJhd',          //Add your master key here. Keep it secret!
    serverURL:          process.env.SERVER_URL          || 'http://localhost:1337/parse',       // Don't forget to change to https if needed
    verifyUserEmails:   process.env.VERIFY_USER_EMAILS  || true,
    publicServerURL:    process.env.PUBLIC_URL          || 'http://localhost:1337/parse',
    appName:            process.env.APP_NAME            || 'Weeclik',
    emailAdapter: {
        module: 'parse-server-simple-mailgun-adapter',
        options: {
            // The address that your emails come from
            fromAddress:    process.env.ADAPTER_FROM_ADDRESS    || 'weeclik@gmail.com',
            // Your domain from mailgun.com
            domain:         process.env.ADAPTER_DOMAIN          || '<domain>.mailgun.org',
            // Your API key from mailgun.com
            apiKey:         process.env.ADAPTER_API_KEY         || 'key-<mailgun_API_key>',
        }
    },
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
//app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// make the Parse Dashboard available at /dashboard
app.use('/dashboard', dashboard);

// Parse Server plays nicely with the rest of your web routes
// app.get('/', function(req, res) {
//   res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
// });

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
// app.get('/test', function(req, res) {
//     res.sendFile(path.join(__dirname, '/public/test.html'));
// });

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
//ParseServer.createLiveQueryServer(httpServer);
