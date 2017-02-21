var app = require('express').Router();
var utils = require('lib/utils.js');
// var controllers = require('lib/controllers.js');

module.exports = app;

app.get("/", utils.setDefaults, function(req,res){
  res.render('index');
});

app.get("/admin", utils.setDefaults, function(req,res){
  res.render('admin');
});

app.get("/map-cluster", utils.setDefaults, function(req,res){
  res.locals.meta.title = 'Ideacamp 2017 Roadbook Projects Locations';

  res.render('map-cluster');
});

app.get("/step:step", utils.setDefaults, function(req, res){
  res.locals.meta.title = 'Ideacamp 2017 Roadbook Group-Steps slider';

  res.render('step', {step: req.params.step});
});
