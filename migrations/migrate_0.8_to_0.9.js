#!/usr/bin/env node

/*
 * Migration Script for version v0.9.0 (May 2019)
 * Moves slides to notes schema
 */


var version = require(__dirname + '/../package.json').version;
var config = require(__dirname + '/../config.json');
var models = require(__dirname + '/../lib/models');
var async = require('async');
var mongoose = require('mongoose');


var Note = models.Note;
var Slide = mongoose.model('Slide');

function abort(exit, msg, err) {
  if(err) console.error(msg, err);
  if(exit) process.exit(1);
  else return;
}


var calls = [];
var count = 0;
var count2 = 0;
calls.push((function(slide){
  return function(_done) {
    slide.collection.dropIndex({ step: 1 }, function(err) {
      _done();
    });
  };
})(Slide));
Slide.find().exec(function(err,slides) {
  if(err) abort(true, 'Error retrieving slides', err);
  slides.forEach(function(slide){
    // console.log(i,slide);
    calls.push((function(_slide){
      slide = _slide.toObject();
      if(slide.step != undefined) {
        slide.space = slide.step
      }
      if(slide.slides) {
        slide.slides.forEach(function(note){
          note.space = slide.space;
          note.space_id = _slide._id;
          calls.push((function(_note){
            return function(_done) {
              console.log('Process note', note._id, 'space', note.space);
              Note.findOneAndUpdate(
                {_id: note._id },
                note,
                {upsert: true},
                function(err){
                  if (!err) count++;
                  _done(err);
                });
            };
          })(note));
        });
      }
      return function(_done){
        console.log('Process slide', slide._id, 'space', slide._id);
        Slide.findOneAndUpdate(
          {_id: slide._id },
          {
            $set: { space: slide.space },
            $unset: { slides: "", step: "" }
          },
          {strict: false},
          function(err){
            if (!err) count2++;
            _done(err);
          });
      };
    })(slide));
  });

  async.series(calls, function(err){
      if (err){
        console.log('Error Ocurred > ');
        console.log(err);
      }

      console.log('Updated %s Notes', count);
      console.log('Updated %s Slides', count2);
      process.exit(0);
    });
});

