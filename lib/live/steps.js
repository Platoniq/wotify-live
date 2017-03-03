var Slide = require('lib/models').Slide;
var _ = require('underscore');

/**
 * @param  io     Use it to sent to everybody
 * @param  client Use it to sent to connected client
 */
module.exports = function(io, client) {
  var liveAdmin = require('lib/live/admin.js')(io);
  var module = {};

  module.sendSlides = function(step, filter, callback, to_client) {
    if(!_.isFunction(callback)) callback = function(){};
    to_client = to_client || client;
    // Send slides from database
    Slide
      .findOne({step:step}, function(err, slide){
        if(err) return liveAdmin.sendError(err);
        // console.log('SLIDE', slide);
        if(!slide) {
          slide = new Slide({step:step,slides:[]});
        }
        if(slide.show !== 'all' && filter) {
          slide.slides = _.filter(slide.slides, function(s){
            return s && s.type === slide.show;
          });
        }
        // Sort by step, not really...
        // slide.slides = _.sortBy(slide.slides, 'group');
        console.log('Sending %d slides to client %s', slide.slides && slide.slides.length, to_client.id);
        to_client.emit('slides step ' + step, slide);
        callback(slide);
      });
  };

  return module;
}
