var mongoose = require('mongoose');
var _ = require('underscore');

var Step = require('lib/models').Step;
var sio = require('socket.io');
var TIME = 3;

module.exports = function(app, server) {

  var io = sio.listen(server);
  var liveSteps = require('lib/live/steps.js')(io);
  var liveAdmin = require('lib/live/admin.js')(io);
  var timeouts = [];

  io.on('connection',function(socket){
      var t = "A user is connected from " + socket.request.headers.referer;
      liveAdmin.sendFeed(t, false, socket.request.headers.referer);
      console.log(t);
      // send initial status to connected clients
      Step
      .find()
      .select('-__v')
      .exec(function(err, steps){
        if(err) return liveAdmin.sendError(err);
        steps.forEach(function(s){
          console.log('Initializing Step', s);
          io.emit('step init', s);
          liveAdmin.sendFeed('Initialized Step ' + s.step + ', Group ' + s.group + ', "' + s.title+'"');
          // sendStepGroup(s.step, s.group);
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
          if(!s.group) {
            s.group = s.step;
          }
          s.save(function(err){
            if(err) return liveAdmin.sendError(err);
            console.log('Step/Group saved into database:', s.toString());
          });
        });
      });

      socket.on('reload remotes',function(){
        liveAdmin.sendFeed('Reloading remote clients');
        // Emit back to clients
        io.emit('reload page');
      });

      /* EVENTS FROM STEPS */

      socket.on('get slides', function(step) {
        liveSteps.sendSlides(step);
      });

      socket.on('end slides', function(step) {
        console.log('END SLIDES Step',step,'Current timeout', timeouts[step]);
        if(timeouts[step]) return;
        // Check for new slides (in a while)
        console.log('Programming new slides in ' + TIME + ' seconds for Step',step);
        timeouts[step] = setTimeout(function(){
          console.log('Timeout init step', step);
          liveSteps.sendSlides(step);
          timeouts[step] = null;
        }, TIME * 1000);
      });

  });
};
