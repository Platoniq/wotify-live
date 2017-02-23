var api = require('lib/api');

module.exports = function(io) {
  var liveAdmin = require('lib/live/admin.js')(io);

  var module = {};

  module.sendSlides = function(step) {

    var sendProjects = function(err, projects) {
      if(err) {
        console.error('ERROR',err);
        liveAdmin.sendFeed('Error getting projects for Step ' + step + ' - ' + err, true);
        return;
      }
      console.log('Sending', projects.length, 'projects for step', step);
      io.emit('projects step ' + step, projects);
    };

    var finishProjects = function(){
      console.log('DONE SENDING PROJECTS Step', step);
      io.emit('end projects step ' + step);
    };

    io.emit('start projects step ' + step);
    // Get projects, and send it to client's arrays
    api.getProjects(step, sendProjects, finishProjects);
  };

  return module;
}
