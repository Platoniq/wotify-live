var api = require('lib/api');
var moment = require('moment');
var mongoose = require('mongoose');

var Step = require('lib/models').Step;
var TIME = 30;

module.exports = function(app, server) {

  /*
   * Module dependencies
   */

  moment.locale('en-gb');
  var sio = require('socket.io');
  var io = sio.listen(server);

  /*  This is auto initiated event when Client connects to Your Machien.  */

  var sendFeed = function(txt, fail, url) {
    io.emit('refresh feed', '<em>' + moment().format('L LT') + '</em> <b>' + txt + '</b>', fail, url);
  };

  var sendStepGroup = function(step, group){

    var sendProjects = function(err, projects) {
      if(err) {
        console.error('ERROR',err);
        sendFeed('Error getting projects for Step ' + step + ', Group ' + group +' - ' + err, true);
        return;
      }
      console.log('Sending', projects.length, 'projects');
      io.emit('add projects', projects);
    };

    var finishProjects = function(){
      console.log('DONE SENDING PROJECTS');
      io.emit('end projects');
    };

    // Get projects, and send it to client's arrays
    api.getProjects(step, group, sendProjects, finishProjects);
  }

  io.on('connection',function(socket){
      var t = "A user is connected from " + socket.request.headers.referer;
      sendFeed(t, false, socket.request.headers.referer);
      console.log(t);
      // TODO: send initial status to connected clients
      if(Step) {
        Step.find(function(err, steps){
          if(err) console.error('ERROR FINDING Steps', err);
          else {
            steps.forEach(function(s){
              console.log('Steps', s);
              sendFeed('Initialized Step ' + s.step + ', Group ' + s.group);
              io.emit('change group', s.step, s.group);
              sendStepGroup(s.step, s.group);
            });
          }
        });
      }
      socket.on('step change', function(step, group){

        // Persist changes if configured mongo
        if(Step) {
          Step.findOne({step:step}, function(err, s){
            if(err) console.error('ERROR GETTING Step', err);
            if(!s) {
              // Create new one
              s = new Step({step: step});
            }
            s.group = group;
            s.save(function(err){
              if(err) console.error('ERROR SAVING Step/Group', err);
              console.log('Step/Group save into database: Step', step, 'Group', group);
            });
          });
        }


        console.log('Step change', step, 'group', group);
        sendFeed('Synchronized Step ' + step + ', Group ' + group);
        // Emit back to clients
        io.emit('change group', step, group);

        sendStepGroup(step, group);
      });

      socket.on('end slides', function() {
        console.log('END SLIDES');
      });

      socket.on('reload remotes',function(){
        sendFeed('Reloading remote clients');
        // Emit back to clients
        io.emit('reload page');
      });
  });
};
