
module.exports = function(app, server) {

  /*
   * Module dependencies
   */

  var sio = require('socket.io');
  var io = sio.listen(server);

  /*  This is auto initiated event when Client connects to Your Machien.  */

  var send_feed = function(txt) {
    io.emit('refresh feed', '<em>' + new Date() + '</em> Admin change: <b>' + txt + '</b>');
  };

  io.on('connection',function(socket){
      console.log("A user is connected");
      // TODO: send initial status to connected clients

      socket.on('step change',function(step, group){
        console.log('Step change', step, 'group', group);
        send_feed('Step ' + step + ', Group ' + group);
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
