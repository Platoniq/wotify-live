var db = require(__dirname + '/../../config.json').db;
var mongoose = require('mongoose');


var models = {

  Step: null,
  User: null,
  Slide: null

}

if(db) {
  console.log('USING DATABASE', db);

  mongoose.connect(db);
  mongoose.Promise = global.Promise;
  var StepSchema = require('./step.js');
  models.Step = mongoose.model('Step', new mongoose.Schema(StepSchema))

  var SlideSchema = require('./slide.js');
  models.Slide = mongoose.model('Slide', new mongoose.Schema(SlideSchema))

  var UserSchema = require('./user.js');
  models.User = mongoose.model('User', new mongoose.Schema(UserSchema))

} else {
  console.error('WARNING: Database not defined!');
}


module.exports = models;
