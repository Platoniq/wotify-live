var app = require('express').Router();
var utils = require('lib/utils.js');

module.exports = app;

app.get("/", utils.setDefaults, function(req,res){
  res.render('index');
});

app.get("/admin", utils.setDefaults, function(req,res){
  res.render('admin');
});

app.get("/map-cluster", utils.setDefaults, function(req,res){
  res.locals.meta.title = 'Roadbook Projects Locations';

  res.render('map-cluster');
});

app.get("/step:step", utils.setDefaults, function(req, res){

  res.render('step', {step: req.params.step});
});
