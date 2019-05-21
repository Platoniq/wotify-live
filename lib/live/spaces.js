var models = require('lib/models');
var utils = require('lib/utils');
var _ = require('underscore');

/**
 * @param  io     Use it to sent to everybody
 * @param  client Use it to sent to connected client
 */
module.exports = function(io, client) {
  var liveAdmin = require('lib/live/admin.js')(io);
  var module = {};

  module.sendSlides = function(space, filter, callback, to_client) {
    if(!_.isFunction(callback)) callback = function(){};
    to_client = to_client || client;
    // Send notes from database
    utils.getChapters(space, function(err, slide) {});
    models.Slide
      .findOne({space:space}, function(err, slide){
        if(err) return liveAdmin.sendError(err);
        // console.log('SLIDE', slide.toObject());
        if(!slide) {
          slide = new Slide({space:space});
        }
        // Add defalt chapters if not present
        slide.chapters = utils.getChapters(slide.chapters);
        // get notes
        note_filter = {space_id: slide._id};
        if(slide.show !== 'all') {
          note_filter.type = slide.show;
        }
        var c = slide.chapter;
        if(c && c !== '_all_' && filter) {
          if(c == '_active_') {
            c = _.findWhere(slide.chapters, { active: true });
            c = c && c.id;
          }
          note_filter.chapter_id = c;
        }
        console.log('FILTER', note_filter);
        models.Note.find(note_filter, function(err, notes) {
          // console.log('NOTES', notes);
          if(err) return liveAdmin.sendError(err);
          // Sort by space, not really...
          // slide.notes = _.sortBy(slide.notes, 'group');
          console.log('Space %d: sending %d notes to client %s', space, notes && notes.length, to_client.id);
          to_client.emit('notes space ' + space, slide, notes);
          callback(slide, notes);
        });
      });
  };

  return module;
}
