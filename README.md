# wotify-widgets

The Wotify Live API integrates widgets and features such as display of scenarios and metrics such as state of the prototypes developed during live co-creation sessions, as well as a live conversations notetaking tool, that allows prototypes owners to get the best out of the live sessions results, back at work. The widgets in that package have been designed to display Visualizations on large screens.

## Dependencies

-  Node
-  npm
-  bower
-  mongodb
-  A [hackdash](https://github.com/Platoniq/hackdash) installation somewhere (Platoniq version)

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
* `token`: Hackdash api bearer token
* `dasboard`: Only use projects from this dashboard (can be null or an Array)
* `db`: MongoDB url string for local storage
* `slideInterval`: Number of seconds between slides for steps screens
* `useCDN`: tryies to use CDN for vendor libraries (like jQuery)
* `port`: 3000 (specify a different port if needed)
