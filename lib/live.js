var util = require('util');
var moment = require('moment');

module.exports = function(app, server) {

  /*
   * Module dependencies
   */

  moment.locale('en-gb');
  var sio = require('socket.io');
  var io = sio.listen(server);

  /*  This is auto initiated event when Client connects to Your Machien.  */

  var send_feed = function(txt, extra) {
    io.emit('refresh feed', '<em>' + moment().format('L LT') + '</em> <b>' + txt + '</b>', extra);
  };

  io.on('connection',function(socket){
      var t = "A user is connected from " + socket.request.headers.referer;
      send_feed(t, socket.request.headers.referer);
      console.log(t);
      // TODO: send initial status to connected clients

      socket.on('step change',function(step, group){
        console.log('Step change', step, 'group', group);
        send_feed('Synchronized Step ' + step + ', Group ' + group);
        // Emit back to clients
        io.emit('change group', step, group);
        // TODO: persist changes somewhere
      });

      socket.on('reload remotes',function(){
        send_feed('Reloading remote clients');
        // Emit back to clients
        io.emit('reload page');
      });
  });
};
