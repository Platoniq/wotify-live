var version   = require('package.json').version;
var config   = require('config.json');

module.exports = {

  setDefaults: function(req, res, next) {
    res.locals.steps=config.steps || [0,1,2,3,4,5,6];
    res.locals.groups=config.groups || [1,2,3,4,5,6];
    res.locals.bodyClass="";
    res.locals.version = version;
    res.locals.useCDN = !!config.useCDN;
    res.locals.slideInterval = config.slideInterval || 5;
    res.locals.meta = {
      title: 'Widgets Idea Camp',
      name: 'IdeaCamp2017',
      description: 'Widgets to follow the progress in the IdeaCamp 2017 Madrid event',
      image: '' // facebook image...
    };
    next();
  }

}
