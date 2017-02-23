var Slide = require('lib/models').Slide;
var _ = require('underscore');

/**
 * @param  io     Use it to sent to everybody
 * @param  client Use it to sent to connected client
 */
module.exports = function(io, client) {
  var liveAdmin = require('lib/live/admin.js')(io);
  var module = {};

  module.sendSlides = function(step, callback) {
    if(!_.isFunction(callback)) callback = function(){};

    // Send slides from database
    Slide
      .findOne({step:step}, function(err, slide){
        if(err) return liveAdmin.sendError(err);
        console.log('Sending %d slides to client %s', slide.slides.length, client.id);
        client.emit('slides step ' + step, slide.slides);
        callback();
      });
  };

  return module;
}
