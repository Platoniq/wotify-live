var moment = require('moment');
moment.locale('en-gb');

module.exports = function(io) {
  var module = {};

  module.sendFeed = function(txt, fail, url) {
    io.emit('refresh feed', '<em>' + moment().format('L LT') + '</em> <b>' + txt + '</b>', fail, url);
  };

  module.sendError = function(err) {
    console.error('ERROR! ', err)
    module.sendFeed(err, true);
    io.emit('error', err);
  };

  return module;
}
