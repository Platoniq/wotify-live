var version   = require('package.json').version;
var config   = require('config.json');

module.exports = {

  setDefaults: function(req, res, next) {
    res.locals.version = version;
    res.locals.useCDN = !!config.useCDN;
    res.locals.meta = {
      title: 'Widgets Idea Camp',
      name: 'IdeaCamp2017',
      description: 'Widgets to follow the progress in the IdeaCamp 2017 Madrid event',
      image: '' // facebook image...
    };
    next();
  }

}
