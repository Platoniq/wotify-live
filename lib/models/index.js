var db = require(__dirname + '/../../config.json').db;
var mongoose = require('mongoose');


var models = {

  Step: null,
  Group: null,
  User: null,
  Slide: null

}

if(db) {
  console.log('USING DATABASE', db);

  mongoose.connect(db);
  mongoose.Promise = global.Promise;
  var StepSchema = require('./step.js');
  models.Step = mongoose.model('Step', new mongoose.Schema(StepSchema, {usePushEach: true}))

  var SlideSchema = require('./slide.js');
  models.Slide = mongoose.model('Slide', new mongoose.Schema(SlideSchema, {usePushEach: true}))

  var GroupSchema = require('./group.js');
  models.Group = mongoose.model('Group', new mongoose.Schema(GroupSchema, {usePushEach: true}))

  var UserSchema = require('./user.js');
  models.User = mongoose.model('User', new mongoose.Schema(UserSchema, {usePushEach: true}))

} else {
  console.error('WARNING: Database not defined!');
}


module.exports = models;
