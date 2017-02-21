var api = require('lib/api');
var moment = require('moment');
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

  io.on('connection',function(socket){
      var t = "A user is connected from " + socket.request.headers.referer;
      sendFeed(t, false, socket.request.headers.referer);
      console.log(t);
      // TODO: send initial status to connected clients

      socket.on('step change',function(step, group){

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
          console.log('DONE, SetTimeout next in ... ' + TIME + ' sec');
          io.emit('end projects');
          // setTimeout(function(){
            // api.getProjects(step, group, sendProjects, finishProjects);
          // }, TIME * 1000);
        };

        console.log('Step change', step, 'group', group);
        sendFeed('Synchronized Step ' + step + ', Group ' + group);
        // Emit back to clients
        io.emit('change group', step, group);
        // TODO: persist changes somewhere
        // Get projects, and send it to client's arrays
        api.getProjects(step, group, sendProjects, finishProjects);

        // Listen to the end of slides
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
