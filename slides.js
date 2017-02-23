#!/usr/bin/env node

/**
 * Module dependencies.
 */

var version = require(__dirname + '/package.json').version;
var config = require(__dirname + '/config.json');
var models = require(__dirname + '/lib/models');

var program = require('commander');
var truncate = require('truncate');
var CronJob = require('cron').CronJob;
var _ = require('underscore');

program
  .version(version)
  .option('-u, --url [url]', 'Specify API URL', config.apiUrl)
  .option('-i, --interval [interval]', 'If defined, poll the api every [interval] seconds')
  .parse(process.argv);

console.log('Using URL %s', program.url);

var api = require(__dirname + '/lib/api.js')(program.url);

if(program.interval) {
  var poll = '*/' + program.interval + ' * * * * *'
  console.log('Polling every %d seconds',program.interval);
  new CronJob(poll, function(){pollProjects(false)}, null, true);
} else {
  pollProjects(true);
}


function pollProjects(exit) {
  console.log('Getting projects...');
  var allProjects = [];
  api.request('/projects', 0, function(err, data){
    console.log('next page...');
    allProjects = _.union(allProjects, data);
  }, function(){
    console.log('Obtained %d projects, now filtering', allProjects.length);
    console.log('Getting configured steps');

    models.Step.find().exec(function(err, steps){
      if(err) {
        console.log('ERROR', err);
        if(exit) process.exit(1);
        else return;
      }
      steps.forEach(function(step) {

        // Filter this projects
        var projects = _.map(allProjects, function(d){
          // Collect all subobjects
          // console.log('DATA', d);
          var texts = [];
          // Add whatif?
          if(d.extra) {
            // if(d.extra.step0 && d.extra.step0.whatif) {
            //   texts.push(d.extra.step0.whatif);
            // }
            _.each(d.extra['step' + step.step], function(val, key){
              texts.push(val);
            });
          }

          return {
            id: d._id,
            title: d.title,
            // description: d.description,
            image: d.cover,
            domain: d.domain,
            text: truncate(texts.join("\n\n"),250),
            author: d.leader && d.leader.name,
            avatar: d.leader && d.leader.picture,
            role: d.leader && d.leader.role
          };
        });
        projects = _.filter(projects, function(d){
          // Minimum 10 chars
          return d.domain === config.dashboard && d.text;
          return d.domain === config.dashboard && d.text && d.text.length > 10 && d.role != 'superadmin';
        });
        console.log('Reduced to %d projects, saving to database', projects.length );

        models.Slide.findOne({step:step.step}, function(err, slide){
          if(err) {
            console.log('ERROR FIND SLIDE', err);
            if(exit) process.exit(1);
            else return;
          }
          if(!slide) slide = new models.Slide({step: step.step});
          slide.slides = projects;
          slide.save(function(err, slide){
            if(err) {
              console.log('ERROR SAVING SLIDE', err);
              if(exit) process.exit(1);
              else return;
            }
            console.log('Saved slide %d with %d slides', slide.step,slide.slides.length);
            if(exit) process.exit();
            else return;
          })
        });
      });
    });
  });
}
