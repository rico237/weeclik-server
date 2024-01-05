# weeclick-parse-server using Node.JS

Weeclik côté serveur utilise Node.JS avec le module : [parse-server](https://github.com/parse-community/parse-server) sur Express.

Il est actuellement hebergé sur des serveurs [Heroku](https://www.heroku.com/), qui est une solution d'hebergement Docker avec des addons gratuit axés sur la lourdeur des services.

La route /parse permet de fait les appels CRUD (Create, Read, Update, Delete)    
La route /dashboard permet d'afficher le dashboard 

La base de donnée est NoSQL avec [MongoDB](https://www.mongodb.com/), hebergé par [mLab](https://www.mlab.com/).    
Un dump de la base de donnée se trouve dans le dossier BD à la racine.  

Utiliser cette commande pour importer le dossier comportant les données de la bdd :
```
mongorestore -h <url-site-mlab>:<port> -d <nom_bdd> -u <utilisateur_admin_bdd> -p <mot_de_passe> <chemin_dossier/dump_bdd>
```

La documentation de parse server : https://docs.parseplatform.org/parse-server/guide/

Le module [parse-dashboard](https://github.com/parse-community/parse-dashboard) permet lui de visualiser et modifier les données de la BDD directement depuis un client web.

La mise en place du dashboard : https://github.com/parse-community/parse-dashboard   
