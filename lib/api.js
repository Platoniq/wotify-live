var Client = require('node-rest-client').Client;
var _ = require('underscore');
var truncate = require('truncate');

var client = new Client();
var LIMIT = 50;

module.exports = function(apiUrl) {
  var module = {};

  module.request = function(path, page, callback, done) {
    if(!_.isFunction(callback)) callback = function(){};
    if(!_.isFunction(done)) done = function(){};
    var self = this;
    client.get(apiUrl + path,
      {
        parameters: {
          limit: LIMIT,
          page: page
        }
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

  return module;
}
