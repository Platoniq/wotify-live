var moment = require('moment');
var _ = require('underscore');
moment.locale('en-gb');

/**
 * @param  io     Use it to sent to everybody
 * @param  client Use it to sent to connected client
 */
var admins = {};
module.exports = function(io, client) {
  var module = {};

  module.addAdmin = function(socket) {
    admins[socket.id] = socket;
    console.log('Added admin', socket.id);
  };

  module.sendFeed = function(txt, fail, url) {
    console.log(fail ? 'E_FEED' : 'FEED', txt);
    io.emit('refresh feed', '<em>' + moment().format('L LT') + '</em> <b>' + txt + '</b>', fail, url);
  };

  /**
   * sends errors messages
   * @param  {string} err       message text
   * @param  {boolean} to_client if true only send message to current client (otherwise everybody)
   * @param  {boolean} important if true marks the message as important (clien my send a native notification)
   */
  module.sendError = function(err, to_client, important) {
    console.error('ERROR! ', err)
    module.sendFeed(err, 'error');
    if(to_client) client.emit('failure', err, important);
    // else io.emit('failure', err);
    else {
      _.each(admins, function(socket){
        socket.emit('failure', err, important);
      });
    }
  };

  module.sendSuccess = function(txt, to_client, important) {
    console.log('SUCCESS! ', txt)
    module.sendFeed(txt, 'success');
    if(to_client) client.emit('success', txt, important);
    // else io.emit('success', txt);
    else {
      _.each(admins, function(socket){
        socket.emit('success', txt, important);
      });
    }
  };

  return module;
}
