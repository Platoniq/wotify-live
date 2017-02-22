var db = require('config.json').db;
var mongoose = require('mongoose');


var models = {

  Step: null

}

if(db) {
  console.log('USING DATABASE', db);

  mongoose.connect(db);
  var StepSchema = require('./step.js');
  models.Step = mongoose.model('Step', new mongoose.Schema(StepSchema))
} else {
  console.error('WARNING: Database not defined!');
}


module.exports = models;
