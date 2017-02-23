var mongoose = require('mongoose');
var _ = require('underscore');

var Step = require('lib/models').Step;
var sio = require('socket.io');
var TIME = 5;

module.exports = function(app, server) {

  var io = sio.listen(server);
  var timeouts = {};


  io.on('connection', function(socket) {
    var liveSteps = require('lib/live/steps.js')(io, socket);
    var liveAdmin = require('lib/live/admin.js')(io, socket);
    var clientId = socket.id;
    timeouts[clientId] = [];
    var t = "A user is connected from " + socket.request.headers.referer + ' ID: ' + clientId;
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
        liveAdmin.sendFeed('Initialized Step ' + s.step + ', Group ' + s.group + ', "' + s.title+'" for client '+ clientId);
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
        _.each(obj, function(val, key){
          s[key] = val;
        });
        if(s.users) {
          s.users = _.uniq(s.users);
        }
        if(!s.group) {
          s.group = s.step;
        }
        s.save(function(err){
          if(err) return liveAdmin.sendError(err);
          console.log('Step/Group saved into database:', s.toString());
          // Global send to all clients
          io.emit('step init', s);
        });
      });
    });

    socket.on('reload remotes',function(){
      liveAdmin.sendFeed('Reloading all remote clients');
      // Emit back to all clients
      io.emit('reload page');
    });

    /* EVENTS FROM STEPS */

    socket.on('get slides', function(step) {
      var sendSlides = function() {
        try{clearTimeout(timeouts[clientId][step])}catch(e){};
        console.log('Done sending project Step',step,' Client',clientId,' Programming next sending in', TIME, 'seconds');
        timeouts[clientId][step] = setTimeout(function(){
          liveSteps.sendSlides(step, sendSlides);
        }, TIME * 1000);
      };
      liveSteps.sendSlides(step, sendSlides);
    });

    socket.on('disconnect', function() {
      liveAdmin.sendFeed('Client ' + clientId + ' disconnected');
      _.each(timeouts[clientId], function(t){
        try{clearTimeout(t)}catch(e){};
      });
    });
  });
};
