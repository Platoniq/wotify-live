var app = require('express').Router();
var utils = require('lib/utils.js');
var models = require('lib/models');
var config   = require('config.json');
var _ = require('underscore');

var title = config && config.title || 'Notify for wotify';
module.exports = app;

app.get("/", utils.setDefaults, function(req,res){
  res.render('index');
});

app.get("/admin", utils.setDefaults, function(req,res){
  res.locals.meta.title = `${title} Admin`;
  res.locals.bodyClass = "admin";
  res.render('admin');
});

app.get("/spaces", utils.setDefaults, function(req,res){
  res.render('spaces');
});

app.get("/spaces/all", utils.setDefaults, function(req, res){
  res.locals.meta.title = `All -${title} Group-Steps sliders`;
  res.locals.bodyClass = "steps";
  var total = res.locals.steps.length;
  if(res.locals.steps[0] === 0) total--;
  res.render('allspaces', {total: total});
});

app.get("/map-cluster", utils.setDefaults, function(req,res){
  res.locals.meta.title = `${title} Projects Locations`;

  res.render('map-cluster');
});

app.get("/space:space", utils.setDefaults, function(req, res){
  res.locals.meta.title = `${title} Group-Steps slider`;
  res.locals.bodyClass = "body-bg-" + req.params.space;
  res.render('space', {space: req.params.space});
});


app.get("/space:step/notes", utils.setDefaults, function(req, res){
  res.locals.meta.title = `${title} Steps Notes`;
  res.locals.bodyClass = "notes";
  res.render('notes', {step: req.params.step});
});


app.get("/notes", utils.setDefaults, function(req,res){
  res.locals.meta.title = `${title} All notes`;
  res.locals.bodyClass = "allnotes";

  res.render('allnotes');
});




app.get("/api/users", function(req,res){
  var rnum = new RegExp('^' + req.query.q);
  var rstr = new RegExp(req.query.q, 'i');
  var q = {$or: [
    {userId:  rnum},
    {name: rstr}
  ]};
  if(req.query.id) {
    q = {userId: req.query.id};
  }
  models.User.find(q)
    .select('-__v -_id -id')
    .sort({userId:1, name: 1})
    .exec(function(err, users){
      if(err) return res.status(500).send(err);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(users.map(function(u){
        u.id = u.userId;
        return u;
      })));
    })
});

app.get("/api/slides", function(req,res){
  var q = {};
  if(req.query.step) {
    q.step = req.query.step;
  }

  var allSlides = [];
  models.Slide.find(q)
    .select('-__v')
    .exec(function(err, slides){
      if(err) return res.status(500).send(err);
      res.setHeader('Content-Type', 'application/json');
      if(slides) {
        slides.forEach(function(s) {
          console.log(s.step);
          s.toObject().notes.forEach(function(slide){
            allSlides.push(_.extend(slide,{step: s.step}));
          });
        });
      }
      res.send(JSON.stringify(allSlides));
    })
});
