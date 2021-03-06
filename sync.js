#!/usr/bin/env node

/**
 * Module dependencies.
 */

var version = require(__dirname + '/package.json').version;
var config = require(__dirname + '/config.json');
var models = require(__dirname + '/lib/models');
var mongoose = require('mongoose');
var program = require('commander');
var truncate = require('truncate');
var async = require('async');
var CronJob = require('cron').CronJob;
var _ = require('underscore');

program
  .version(version)
  .option('-u, --url [url]', 'Specify API URL', config.apiUrl)
  .option('-t, --token [token]', 'Specify API BEARER token', config.token)
  .option('-i, --interval [interval]', 'If defined, poll the api every [interval] seconds')
  .parse(process.argv);

console.log('Using URL %s', program.url);

var api = require(__dirname + '/lib/api.js')(program.url, program.token);

POLLING=false;

if(program.interval) {
  var poll = '*/' + program.interval + ' * * * * *'
  console.log('Polling every %d seconds',program.interval);
  new CronJob(poll, function(){
    if(POLLING) {
      console.error('ALREADY POLLING, ABORTING');
    } else {
      pollProjects(false);
    }
  }, null, true);
} else {
  pollProjects(true);
}

function abort(exit, msg, err) {
  POLLING=false;
  if(err) console.error(msg, err);
  if(exit) process.exit(1);
  else return;
}

function pollProjects(exit) {
  var allProjects = [];
  var allUsers = [];
  var allGroups = [];
  var allSteps = [];
  var allSlides = [];
  var allNotes = [];
  console.log('Sync users...');
  POLLING=true;
  if(config.userZero) {
    // Insert user zero if configure
    config.userZero.userId = "0";
    console.log('Insert user zero', config.userZero);
    allUsers.push(config.userZero);
  }
  api.request('/users', 0, function(err, data){
      if(err) return abort(exit, 'ERROR', err);
      console.log('%d results, going to next page...', data.length);
      allUsers = _.union(allUsers, data);
  }, function(err, data){
    console.log('Obtained %d users, now saving data', allUsers.length);

    var calls = [];

    // console.log('Getting users...');
    allUsers.forEach(function(u, index){
      calls.push(function(callback){
        var twitter = u.social && u.social.twitter;
        if(twitter) twitter = twitter.replace(/^(.*)twitter\.com\//g,'');
        else twitter = '';
        var user = {id: u._id, userId:u.userId, name:u.name, role:u.role, bio:u.bio, avatar: u.picture, twitter: twitter };
        if(u.email) {
          user.email = u.email;
        }
        models.User.findOneAndUpdate({id: user.id},user,{upsert:true},function(){
          console.log(index + ' - Imported user', user.userId,user.name,user.id,user.twitter);
          callback();
        });
      });
    });

    calls.push(function(callback) {
      // console.log('Getting groups...');
      models.Group.find().exec(function(err, groups){
        if(err) return abort(exit, 'ERROR', err);
        allGroups = groups;
        console.log("Found %d groups", groups.length);
        callback();
      });
    });

    calls.push(function(callback) {
      // console.log('Getting steps...');
      models.Step.find().exec(function(err, steps){
        if(err) return abort(exit, 'ERROR', err);
        allSteps = steps;
        console.log("Found %d steps", steps.length);
        callback();
      });
    });

    calls.push(function(callback) {
      // console.log('Getting slides...');
      models.Slide.find().exec(function(err, slides){
        if(err) return abort(exit, 'ERROR', err);
        allSlides = slides;
        console.log("Found %d slides", slides.length);
        callback();
      });
    });

    calls.push(function(callback) {
      // console.log('Getting notes...');
      models.Note.find().exec(function(err, notes){
        if(err) return abort(exit, 'ERROR', err);
        allNotes = notes;
        console.log("Found %d notes", notes.length);
        callback();
      });
    });

    calls.push(function(callback) {
      console.log('Getting projects...');
      api.request('/projects', 0, function(err, data) {
        if(err) return abort(exit, 'ERROR', err);
        console.log('%d projects found...', data.length);
        allProjects = _.union(allProjects, data);
      }, function(){
        callback();
      });
    });

    calls.push(function(callback) {
      console.log('Obtained %d projects, now filtering notes', allProjects.length);
      config.steps.forEach(function(step) {
        var notes = api.filterProjects(step, allProjects);
        if(!notes || !notes.length) {
          console.error('No filtered notes found for step %d, Fallback to Step 0 (Whatif)', step);
          notes = api.filterProjects(0, allProjects);
        }
        // Assing space
        var s = _.findWhere(allSlides, { space: step });
        notes.forEach(function(n, i) {
          notes[i].space = s.space;
          notes[i].space_id = s._id;
          // console.log(notes[i]);
        });
        console.log('%d notes for step %d', notes.length, step);
        // Mix notes
        allNotes = _.union(allNotes, notes);
      });
      // fix notes
      var subcalls = [];
      allNotes.forEach(function(note) {
        var s =  {
          id: note.id,
          type: note.type,
          userId: note.userId,
          text: note.text,
          space: note.space,
          space_id: note.space_id
        };
        // console.log('Note check', s);
        subcalls.push(function(callback) {
          var u = _.findWhere(allUsers, {userId: s.userId});
          if(u) {
            if(!s.id) {
              console.log('Creating new note with', s.text);
            }
            s.author = u.name;
            s.role = u.role;
            s.avatar = u.picture;
            s.bio = u.bio;
            // console.log('FOUND USER', u, 'AGAINST SLIDE', s);
            var twitter = u.social && u.social.twitter;
            if(twitter) s.twitter = twitter.replace(/^(.*)twitter\.com\//g,'')
            // console.log('RESULT USER', s);
            // get group
            var group = _.find(allGroups, function(g){
              return _.indexOf(g.users, u.userId) != -1;
            });
            // console.log('ALL GROUPS',allGroups,'GROUP FOUND',group)
            if(group) {
              s.group = group.group;
            }
            models.Note.findOneAndUpdate({id: s.id},s,{upsert: true},function(err){
              if(err) return abort(exit, ['ERROR SAVING NOTE', s], err);
              console.log('Saved note', s.id);
              callback();
            });
          } else {
            callback();
          }
        });
      });
      async.parallel(subcalls, callback);
    });

    async.series(calls, function(err, result) {
      if(err) return abort(exit, 'ERROR', err);
      console.log('Done importing %d items',result.length);

      abort(exit);
    });
  });
}
