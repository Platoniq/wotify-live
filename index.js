var express   = require("express");
var app       = express();
var http      = require('http').Server(app);
var pug       = require('pug');
var less      = require('less-middleware');
var routes    = require('lib/routes.js');
var live      = require('lib/live.js');
var config    = require('config.json');
require('lib/models');


// Setup template engine
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
// Autocompile less
app.use(less(__dirname + '/public', {debug:true}));

// Set to use bower
app.use('/components',  express.static(__dirname + '/bower_components'));

// Add routes
app.use('/', routes);

// Handle public assets
app.use(express.static(__dirname + '/public'));

// Live (socket.io) features
live(app, http);

var port = process.env.PORT || config.port || '3000';

http.listen(port,function(){
    console.log("Listening on " + port);
});
