var express   = require("express");
var app       = express();
var http      = require('http').Server(app);
var pug       = require('pug');
var less      = require('less-middleware');
var routes    = require('lib/routes.js');
var live = require('lib/live.js');

// Setup template engine
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
// Autocompile less
app.use(less(__dirname + '/public', {debug:true}));

// Add routes
app.use('/', routes);

// Handle public assets
app.use(express.static(__dirname + '/public'));

// Live (socket.io) features
live(app, http);

http.listen(3000,function(){
    console.log("Listening on 3000");
});
