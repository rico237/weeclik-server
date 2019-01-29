# weeclick-parse-server using Node.JS

## [Lien vers le Parse-dashboard actuel](https://weeclik-dash.herokuapp.com/)

Weeclik côté serveur utilise Node.JS avec le module : [parse-server](https://github.com/parse-community/parse-server) sur Express.

Il est actuellement hebergé sur des serveurs [Heroku](https://www.heroku.com/), qui est une solution d'hebergement Docker avec des addons gratuit axés sur la lourdeur des services.

La route /parse permet de fait les appels CRUD (Create, Read, Update, Delete)    
La route /dashboard permet d'afficher le dashboard 

La base de donnée est NoSQL avec [MongoDB](https://www.mongodb.com/), hebergé par [mLab](https://www.mlab.com/).    
Un dump de la base de donnée se trouve dans le dossier BD à la racine.  

Utiliser la commande pour importer le dump (fichier .bson) :
```
mongorestore -h <url-site-mlab>:<port> -d <nom_bdd> -u <utilisateur_admin_bdd> -p <mot_de_passe> <fichier_bdd.bson>
```

La documentation de parse server : https://docs.parseplatform.org/parse-server/guide/

Le module [parse-dashboard](https://github.com/parse-community/parse-dashboard) permet lui de visualiser et modifier les données de la BDD directement depuis un client web.

La mise en place du dashboard : https://github.com/parse-community/parse-dashboard   

### For Local Development

* Make sure you have at least Node 4.3. `node --version`
* Clone this repo and change directory to it.
* `npm install`
* Install mongo locally using http://docs.mongodb.org/master/tutorial/install-mongodb-on-os-x/
* Run `mongo` to connect to your database, just to make sure it's working. Once you see a mongo prompt, exit with Control-D
* Run the server with: `npm start`
* By default it will use a path of /parse for the API routes.  To change this, or use older client SDKs, run `export PARSE_MOUNT=/1` before launching the server.
* You now have a database named "dev" that contains your Parse data
* Install ngrok and you can test with devices

### Getting Started With Heroku + mLab Development

#### With the Heroku Button

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

#### Without It

* Clone the repo and change directory to it
* Log in with the [Heroku Toolbelt](https://toolbelt.heroku.com/) and create an app: `heroku create`
* Use the [mLab addon](https://elements.heroku.com/addons/mongolab): `heroku addons:create mongolab:sandbox --app YourAppName`
* By default it will use a path of /parse for the API routes.  To change this, or use older client SDKs, run `heroku config:set PARSE_MOUNT=/1`
* Deploy it with: `git push heroku master`

# Using it

You can use the REST API, the JavaScript SDK, and any of our open-source SDKs:

Example request to a server running locally:

```curl
curl -X POST \
  -H "X-Parse-Application-Id: myAppId" \
  -H "Content-Type: application/json" \
  -d '{"score":1337,"playerName":"Sean Plott","cheatMode":false}' \
  http://localhost:1337/parse/classes/GameScore
  
curl -X POST \
  -H "X-Parse-Application-Id: myAppId" \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:1337/parse/functions/hello
```

Example using it via JavaScript:

```javascript
Parse.initialize('myAppId','unused');
Parse.serverURL = 'https://whatever.herokuapp.com';

var obj = new Parse.Object('GameScore');
obj.set('score',1337);
obj.save().then(function(obj) {
  console.log(obj.toJSON());
  var query = new Parse.Query('GameScore');
  query.get(obj.id).then(function(objAgain) {
    console.log(objAgain.toJSON());
  }, function(err) {console.log(err); });
}, function(err) { console.log(err); });
```

Example using it on Android:
```java
//in your application class

Parse.initialize(new Parse.Configuration.Builder(getApplicationContext())
  .applicationId("myAppId")
  .server("http://myServerUrl/parse/")   // '/' important after 'parse'
  .build());

ParseObject testObject = new ParseObject("TestObject");
testObject.put("foo", "bar");
testObject.saveInBackground();
```
Example using it on iOS (Swift):
```swift
//in your AppDelegate

Parse.initializeWithConfiguration(ParseClientConfiguration(block: { (configuration: ParseMutableClientConfiguration) -> Void in
  configuration.server = "https://<# Your Server URL #>/parse/" // '/' important after 'parse'
  configuration.applicationId = "<# Your APP_ID #>"
}))
```
