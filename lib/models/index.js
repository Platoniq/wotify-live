var db = require(__dirname + '/../../config.json').db;
var mongoose = require('mongoose');


var models = {

  Step: null,
  Slide: null

}

if(db) {
  console.log('USING DATABASE', db);

  mongoose.connect(db);
  var StepSchema = require('./step.js');
  models.Step = mongoose.model('Step', new mongoose.Schema(StepSchema))

  var SlideSchema = require('./slide.js');
  models.Slide = mongoose.model('Slide', new mongoose.Schema(SlideSchema))

} else {
  console.error('WARNING: Database not defined!');
}


module.exports = models;
