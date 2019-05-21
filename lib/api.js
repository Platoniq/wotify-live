var config   = require(__dirname + '/../config.json');
var Client = require('node-rest-client').Client;
var _ = require('underscore');
var truncate = require('truncate');

var client = new Client();
var LIMIT = 50;

module.exports = function(apiUrl, token) {
  var module = {};

  module.request = function(path, page, callback, done) {
    if(!_.isFunction(callback)) callback = function(){};
    if(!_.isFunction(done)) done = function(){};
    var self = this;
    client.get(apiUrl + path,
      {
        parameters: {
          limit: LIMIT,
          page: page,
          role: ''
        },
        headers: { "Authorization": "Bearer " + token || config.token }
      },
      function (data, response) {
        //if data send callback and find next
        if(data && data.length) {
          // console.log('DATA',data.length);
          callback(null, data);
          self.request(path, page + 1, callback, done);
        } else {
          done(path);
        }
      }).on('error', function (err) {
          console.log('Something went wrong on the request', err.request.options);
          callback(err.request.options.toString());
      });
  };

  module.filterProjects = function(step, allProjects) {
    var projects = [];
    _.each(allProjects, function(d, index){
      // Collect all subobjects
      // console.log('DATA', d.extra);
      var texts = [];
      // Add whatif?
      if(d.extra) {
        // if(d.extra.step0 && d.extra.step0.whatif) {
        //   texts.push(d.extra.step0.whatif);
        // }
        _.each(d.extra['step' + step], function(val, key){
          texts.push(val);
        });
      }

      // console.log('TEXTS', texts);
      texts.forEach(function(t, index2){
        var p = {
          id: (d.projectId || d._id) + '-' + index2,
          title: d.title,
          location: d.location,
          // description: d.description,
          image: d.cover,
          domain: d.domain,
          text: t,
          userId: d.leader.userId,
          project_id: d._id,
          author: d.leader && d.leader.name,
          avatar: d.leader && d.leader.picture,
          role: d.leader && d.leader.role,
          type: 'api'
        };
        if(d.projectId) p.projectId = d.projectId;

        if(!_.findWhere(projects, {id:p.id})) {
          // console.log('ADD PROJECT', p);
          projects.push(p);
        }
      });
    });

    // console.log('PROJECTS', projects);
    return _.filter(projects, function(d){
      // Minimum 10 chars
      var dash = config.dashboard;
      var dashAllowed = _.isNull(dash) || (_.isArray(dash) ? _.contains(dash, d.domain) : d.domain === dash);
      if(!dashAllowed) {
        console.error("Dashboard not allowed! " , dash);
      }
      return dashAllowed && d.text;
      return dashAllowed && d.text && d.text.length > 10 && d.role != 'superadmin';
    });

  }
  return module;
}
