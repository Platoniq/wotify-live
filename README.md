# wotify-widgets
Widgets for the wotify (hackdash) api widgets.ideacamp2017.eu

## Dependencies

-  Node
-  npm
-  bower
-  mongodb
-  A [hackdash](https://github.com/GoteoFoundation/hackdash) installation somewhere (GoteoFoundation version)

# Development

Create and edit/tune the `config.json` file:

```
cp config.json.sample config.json
nano config.json
```

Install the environment:

```
bower install
npm install
```

Fill the database using the node script

```
./sync.js
```

Slides script can be executed as a cron process:

```
./sync.js -i 30
```

Start the local server:

```
npm start
```

Go to http://localhost:3000

# Config options

* `apiUrl`: Hackdash api point (Wotify version version>=0.29)
* `dasboard`: Only use projects from this dashboard (can be null or an Array)
* `db`: MongoDB url string for local storage
* `slideInterval`: Number of seconds between slides for steps screens
* `useCDN`: tryies to use CDN for vendor libraries (like jQuery)
