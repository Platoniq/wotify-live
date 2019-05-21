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
      title: config.title || 'Notify for Wotify',
      name: 'Notify',
      description: config.description || 'Widgets and tools for the Wotify project',
      image: '' // facebook image...
    };
    res.locals.texts = config.texts || {};
    next();
  }

}
