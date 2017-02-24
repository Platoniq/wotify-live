var moment = require('moment');
moment.locale('en-gb');

/**
 * @param  io     Use it to sent to everybody
 * @param  client Use it to sent to connected client
 */
module.exports = function(io, client) {
  var module = {};

  module.sendFeed = function(txt, fail, url) {
    console.log(fail ? 'E_FEED' : 'FEED', txt);
    io.emit('refresh feed', '<em>' + moment().format('L LT') + '</em> <b>' + txt + '</b>', fail, url);
  };

  module.sendError = function(err, to_client) {
    console.error('ERROR! ', err)
    module.sendFeed(err, 'error');
    if(to_client) client.emit('failure', err);
    else io.emit('failure', err);
  };

  module.sendSuccess = function(txt, to_client) {
    console.log('SUCCESS! ', txt)
    module.sendFeed(txt, 'success');
    if(to_client) client.emit('success', txt);
    else io.emit('success', txt);
  };

  return module;
}
