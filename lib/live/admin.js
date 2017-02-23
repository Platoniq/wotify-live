var moment = require('moment');
moment.locale('en-gb');

module.exports = function(io, client) {
  var module = {};

  module.sendFeed = function(txt, fail, url) {
    client.emit('refresh feed', '<em>' + moment().format('L LT') + '</em> <b>' + txt + '</b>', fail, url);
  };

  module.sendError = function(err) {
    console.error('ERROR! ', err)
    module.sendFeed(err, true);
    client.emit('error', err);
  };

  return module;
}
