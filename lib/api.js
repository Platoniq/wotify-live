var apiUrl   = require('config.json').apiUrl;
console.log('Using apiUrl', apiUrl);

var Client = require('node-rest-client').Client;
var _ = require('underscore');

var client = new Client();
var LIMIT = 50;

module.exports = {
  request: function(path, page, callback, done) {
    if(!_.isFunction(callback)) callback = function(){};
    if(!_.isFunction(done)) done = function(){};
    var self = this;
    client.get(apiUrl + path, {
        parameters: {
          limit: LIMIT,
          page: page
        }
      }, function (data, response) {
        //if data send callback and find next
        if(data && data.length) {
          // console.log('DATA',data.length);
          callback(null, data);
          self.request(path, page + 1, callback, done);
        } else {
          done(path);
        }
    }).on('error', function (err) {
        console.log('something went wrong on the request', err.request.options);
        callback(err.request.options);
    });
  },

  getProjects: function(step, group, callback, done) {
    if(!_.isFunction(callback)) callback = function(){};
    // connect to API
    this.request('/projects', 0, function(err, data){
      if(err) return callback(err);
      // TODO: better filtering

      var projects = _.map(data, function(d){
        // Collect all subobjects
        // console.log('DATA', d);
        var texts = [];
        // Add whatif?
        if(d.extra) {
          // if(d.extra.step0 && d.extra.step0.whatif) {
          //   texts.push(d.extra.step0.whatif);
          // }
          _.each(d.extra['step' + step], function(val, key){
            texts.push(val);
          });
          console.log('TEXT P',d._id,texts);
        }

        return {
          id: d._id,
          // title: d.title,
          // description: d.description,
          // image: d.cover,
          text: texts.join('"\n___\n'),
          author: d.leader && d.leader.name,
          avatar: d.leader && d.leader.picture,
          role: d.leader && d.leader.role
        };
      });
      projects = _.filter(projects, function(d){
        // Minimum 10 chars
        return d.text;
        return d.text && d.text.length > 10 && d.role != 'superadmin';
      });
      // console.log('DATA', data);
      // console.log('PROJECTS', projects);
      callback(null, projects);
    }, function(path) {
      done();
    });
  }

}
