var mongoose = require('mongoose');
var _ = require('underscore');

var models = require('lib/models');
var Step = models.Step;
var User = models.User;
var Slide = models.Slide;
var Group = models.Group;
var sio = require('socket.io');
var slideInterval = require('config.json').slideInterval || 5;

module.exports = function(app, server) {

  var io = sio.listen(server);
  var timeouts = {};
  var clients = {};

  var isPath = function(client, path) {
    try {
      return clients[client].request.headers.referer.indexOf(path) !== -1;
    }catch(e){
      console.error('Not found client',client);
    }
    return false;
  };

  io.on('connection', function(socket) {
    var liveSteps = require('lib/live/steps.js')(io, socket);
    var liveAdmin = require('lib/live/admin.js')(io, socket);
    var clientId = socket.id;
    timeouts[clientId] = [];
    clients[clientId] = socket;

    var t = "An User is connected from ";
    if(isPath(clientId, '/admin')) {
      liveAdmin.addAdmin(socket);
      t = "An Admin is connected from ";
    }

    t += socket.request.headers.referer + ' ID: ' + clientId;
    liveAdmin.sendFeed(t, false, socket.request.headers.referer);

    // send initial status to connected clients
    Step
    .find()
    .select('-__v')
    .exec(function(err, steps){
      if(err) return liveAdmin.sendError(err);
      steps.forEach(function(s){
        console.log('Initializing Step', s.step);
        // Send to this client only
        socket.emit('step init', s);
        liveAdmin.sendFeed('Initialized Step ' + s.step + ', Group ' + s.group + ', "' + s.title + '" for client '+ clientId);
      });
    });

    Group
    .find()
    .select('-__v')
    .exec(function(err, groups){
      if(err) return liveAdmin.sendError(err);
      groups.forEach(function(s){
        console.log('Initializing Group', s.group);
        // Send to this client only
        socket.emit('group init', s);
        liveAdmin.sendFeed('Initialized Group ' + s.group + ' "' + s.title + '" for client '+ clientId);
      });
    });

    /* EVENTS FROM ADMIN */
    socket.on('step change', function(obj){

      console.log('Step change', obj.toString());

      // Persist changes if configured mongo
      Step.findOne({step:obj.step}, function(err, s){
        if(err) return liveAdmin.sendError(err);
        if(!s) {
          // Create new one
          s = new Step({step: obj.step});
        }
        var oldgroup = s.group;
        _.each(obj, function(val, key){
          s[key] = val;
        });
        if(s.users) {
          s.users = _.uniq(s.users);
        }
        // Group defaults to the same step (if available)
        if(!s.group) {
          s.group = s.step;
        }
        s.save(function(err){
          if(err) return liveAdmin.sendError(err);
          console.log('Step saved into database:', s.toString());
          // Global send to all clients
          io.emit('step init', s);
          if(s.group != oldgroup) {
            Group.findOne({group:s.group}, function(err,g){
              if(err) return liveAdmin.sendError(err);
              io.emit('group init', g ? g : {group:s.group});
            });
          }
        });
      });
    });

    socket.on('group change', function(obj){

      console.log('Group change', obj.toString());

      // Persist changes if configured mongo
      Group.findOne({group:obj.group}, function(err, s){
        if(err) return liveAdmin.sendError(err);
        if(!s) {
          // Create new one
          s = new Group({group: obj.group});
        }
        _.each(obj, function(val, key){
          s[key] = val;
        });
        if(s.users) {
          s.users = _.uniq(s.users);
        }
        if(!s.group) {
          s.group = s.group;
        }
        s.save(function(err){
          if(err) return liveAdmin.sendError(err);
          console.log('Group saved into database:', s.toString());
          // Global send to all clients
          io.emit('group init', s);
        });
      });
    });

    socket.on('reload remotes',function(){
      liveAdmin.sendFeed('Reloading all remote clients');
      // Emit back to all clients
      io.emit('reload page');
    });

    /* EVENTS FROM NOTES */

    var timeoutSlides = function(step, filter, client) {
      client = client || clientId;
      var sendSlides = function(slide) {
        try{clearTimeout(timeouts[client][step])}catch(e){};
        var time = slideInterval * ((slide && slide.slides && slide.slides.length) || 1);
        console.log('Done sending project Step',step,' Client',client,(filter?' (filtered)':''),' Programming next sending in', time, 'seconds');
        timeouts[client][step] = setTimeout(function(){
          liveSteps.sendSlides(step, !!filter, sendSlides, clients[client]);
        }, time * 1000);
      };
      liveSteps.sendSlides(step, !!filter, sendSlides, clients[client]);
    };

    var resendAllFilteredSlides = function(step) {
      _.each(timeouts, function(steps, client){
        _.each(steps, function(timeout, sKey) {
          // console.log('Send to client',clients[client].request.headers.referer);
          // Send everybody, not to notes
          if(step === sKey) {
            if(isPath(client, '/notes')) {
              console.log('Resending to note client %s, Step %d', client, sKey);
              timeoutSlides(step, false, client);
            } else {
              console.log('Resending to step client %s, Step %d', client, sKey);
              timeoutSlides(step, true, client);
            }
          }
        });
      });
    };

    // Slides editing
    socket.on('slide change', function(obj) {
      console.log('Slide change', obj);
      var add = obj && obj.add;
      Slide.findOne({step:obj.step}, function(err, slide) {
        if(err) return liveAdmin.sendError(err, true);

        if(obj && obj.show) {
          // Slide edit
          slide.show = obj.show;
          slide.save(function(err, slide){
            if(err) return liveAdmin.sendError(err, true);
            liveAdmin.sendSuccess('Now showing "' + slide.show + '" in Step ' + slide.step, true);
            // Send filtered to clients
            resendAllFilteredSlides(slide.step);
          });
        } else {
          // Note adding
          if(!add.text) {
            return liveAdmin.sendError('Missing text!', true);
          }
          if(!add.userId) {
            return liveAdmin.sendError('Missing user!', true);
          }
          // Find user
          User.findOne({userId:add.userId}, function(err, user) {
            if(err) return liveAdmin.sendError(err, true);
            if(!slide) return liveAdmin.sendError('Not found step ' + slide.step, true);
            add.author = user.name;
            add.avatar = user.avatar;
            add.role = user.role;
            add.twitter = user.twitter;
            add.type = 'note';
            slide.slides = slide.slides || [];
            // Get note if editing
            var i = _.findIndex(slide.slides, function(s) {
              if(add.id == s.id) return true;
            });
            if(i > -1) {
              slide.slides[i] = add;
            } else {
              var ids = _.pluck(_.filter(slide.slides, function(s){
                return s.type == 'note';
              }), 'id');
              // TEMP: fix id in slides
              // var ids_ok = {};
              // ids.forEach(function(s,v) {
              //   slide.slides[v].id = (v + 1) + '-n';
              //   console.log('ID',s,v,slide.slides[v].id);
              // });
              var last = parseInt(ids.length, 10) || 0;
              console.log('Last Id', last);
              add.id = (last + 1) + '-n';
              slide.slides.push(add);
            }
            console.log('Saving slide', i, slide.slides.length);
            slide.save(function(err, slide){
              if(err) return liveAdmin.sendError(err, true);
              liveAdmin.sendSuccess('Added note "' + add.text + '" in Step ' + slide.step, true);
              // Send filtered to clients
              resendAllFilteredSlides(slide.step);
            });
          });
        }
      });
    });

    socket.on('slide remove', function(obj) {
      console.log('Slide remove', obj);
      // find slide
      Slide.findOne({step:obj.step}, function(err, slide){
        if(err) return liveAdmin.sendError(err, true);
        if(!slide) return liveAdmin.sendError('Not found step ' + slide.step, true);
        // Get note if editing
        var i = _.findIndex(slide.slides, function(s) {
          if(obj.id == s.id) return true;
        });
        if(i > -1) {
          slide.slides.splice(i, 1);
          slide.save(function(err, slide){
            if(err) return liveAdmin.sendError(err, true);
            liveAdmin.sendSuccess('Removed slide "' + obj.id + '" in Step ' + slide.step, true);
            // Send filtered to clients
            resendAllFilteredSlides(slide.step);
          });
        } else {
          liveAdmin.sendError('Slide ' + slide.id + ' not found!', true);
        }
      });
    });

    socket.on('step panic', function(step, panic){
      console.log('STEP %d PANIC!!!', step);

      // Persist changes if configured mongo
      Step.findOne({step:step}, function(err, s){
        if(err) return liveAdmin.sendError(err);
        if(!s) {
          // Create new one
          s = new Step({step: step});
        }
        s.panic = !!panic;
        s.save(function(err){
          if(err) return liveAdmin.sendError(err);
          console.log('Step saved into database:', s.toString());
          // Global send to all clients
          io.emit('step init', s);
          if(s.panic) {
            liveAdmin.sendError('Panic request on Step ' + s.step +'!', false, {url:'/step'+s.step+'/notes'});
            liveAdmin.sendError('Help is on the way!', clientId);
          }
          else {
            liveAdmin.sendSuccess('Panic dismissed on Step ' + s.step, false, true);
            liveAdmin.sendSuccess('Okay. Everything under control?', clientId);
          }
        });
      });
    });

    /* EVENTS FROM STEPS */

    // Get slides for a individual client
    socket.on('get slides', function(step, show_all) {
      console.log('get slides for Step ', step);
      timeoutSlides(step, !show_all);
    });

    socket.on('disconnect', function() {
      liveAdmin.sendFeed('Client ' + clientId + ' disconnected');
      delete clients[clientId];
      _.each(timeouts[clientId], function(t){
        try{clearTimeout(t)}catch(e){};
      });
    });
  });
};
