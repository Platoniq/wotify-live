var Slide = require('lib/models').Slide;
var _ = require('underscore');

/**
 * @param  io     Use it to sent to everybody
 * @param  client Use it to sent to connected client
 */
module.exports = function(io, client) {
  var liveAdmin = require('lib/live/admin.js')(io);
  var module = {};

  module.sendSlides = function(step, filter, callback) {
    if(!_.isFunction(callback)) callback = function(){};

    // Send slides from database
    Slide
      .findOne({step:step}, function(err, slide){
        if(err) return liveAdmin.sendError(err);
        if(slide) {
          if(slide.show !== 'all' && filter) {
            slide.slides = _.filter(slide.slides, function(s){
              return s.type === slide.show;
            });
          }
          console.log('Sending %d slides to client %s', slide.slides && slide.slides.length, client.id);
          client.emit('slides step ' + step, slide);
        }
        callback(slide);
      });
  };

  return module;
}
