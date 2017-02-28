var app = require('express').Router();
var utils = require('lib/utils.js');
var models = require('lib/models');

module.exports = app;

app.get("/", utils.setDefaults, function(req,res){
  res.render('index');
});

app.get("/admin", utils.setDefaults, function(req,res){
  res.render('admin');
});

app.get("/steps", utils.setDefaults, function(req,res){
  res.render('steps');
});


app.get("/map-cluster", utils.setDefaults, function(req,res){
  res.locals.meta.title = 'Ideacamp 2017 Roadbook Projects Locations';

  res.render('map-cluster');
});

app.get("/step:step", utils.setDefaults, function(req, res){
  res.locals.meta.title = 'Ideacamp 2017 Roadbook Group-Steps slider';
  res.locals.bodyClass = "body-bg-" + req.params.step;
  res.render('step', {step: req.params.step});
});

app.get("/step:step/notes", utils.setDefaults, function(req, res){
  res.locals.meta.title = 'Ideacamp 2017 Roadbook Steps Notes';

  res.render('notes', {step: req.params.step});
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
