var mongoose = require('mongoose');
var _ = require('underscore');

var models = require('lib/models');
var Step = models.Step;
var User = models.User;
var Slide = models.Slide;
var Group = models.Group;
var Note = models.Note;
var sio = require('socket.io');
var config = require('config.json');
var slideInterval = config.slideInterval || 5;
var allGroups = config.groups || [1,2,3,4,5,6];

module.exports = function(app, server) {

  var io = sio.listen(server);
  var timeouts = {};
  var clients = {};

  var isPath = function(client, path) {
    try {
      return clients[client].request.headers.referer.indexOf(path) !== -1;
    }catch(e){
      console.error('Not found client',client);
    }
    return false;
  };

  io.on('connection', function(socket) {
    var liveSteps = require('lib/live/spaces.js')(io, socket);
    var liveAdmin = require('lib/live/admin.js')(io, socket);
    var clientId = socket.id;
    timeouts[clientId] = [];
    clients[clientId] = socket;

    var t = "An User is connected from ";
    if(isPath(clientId, '/admin')) {
      liveAdmin.addAdmin(socket);
      t = "An Admin is connected from ";
    }

    t += socket.request.headers.referer + ' ID: ' + clientId;
    liveAdmin.sendFeed(t, false, socket.request.headers.referer);

    // send initial status to connected clients
    Step
    .find()
    .select('-__v')
    .exec(function(err, steps){
      if(err) return liveAdmin.sendError(err);
      steps.forEach(function(s){
        console.log('Initializing Step', s.step);
        // Send to this client only
        socket.emit('step init', s);
        liveAdmin.sendFeed('Initialized Step ' + s.step + ', Group ' + s.group + ', "' + s.title + '" for client '+ clientId);
      });
    });

    Group
    .find()
    .select('-__v')
    .exec(function(err, groups){
      if(err) return liveAdmin.sendError(err);
      groups.forEach(function(s){
        console.log('Initializing Group', s.group);
        // Send to this client only
        socket.emit('group init', s);
        liveAdmin.sendFeed('Initialized Group ' + s.group + ' "' + s.title + '" for client '+ clientId);
      });
    });

    /* EVENTS FROM ADMIN */
    socket.on('step change', function(obj){

      console.log('Step change', obj.toString());

      // Persist changes if configured mongo
      Step.findOne({step:obj.step}, function(err, s){
        if(err) return liveAdmin.sendError(err);
        if(!s) {
          // Create new one
          s = new Step({step: obj.step});
          console.log('Creating new step', s);
        }
        var oldgroup = s.group;
        _.each(obj, function(val, key){
          s[key] = val;
        });
        if(s.users) {
          s.users = _.uniq(s.users);
        }
        // Group defaults to the same step (if available)
        if(!s.group && _.indexOf(allGroups, s.step) !== -1) {
          s.group = s.step;
        }
        s.save(function(err){
          if(err) return liveAdmin.sendError(err);
          console.log('Step saved into database:', s.toString());
          // Global send to all clients
          io.emit('step init', s);
          if(s.group != oldgroup) {
            Group.findOne({group:s.group}, function(err,g){
              if(err) return liveAdmin.sendError(err);
              io.emit('group init', g ? g : {group:s.group});
            });
          }
        });
      });
    });

    socket.on('group change', function(obj){

      console.log('Group change', obj.toString());

      // Persist changes if configured mongo
      Group.findOne({group:obj.group}, function(err, s){
        if(err) return liveAdmin.sendError(err);
        if(!s) {
          // Create new one
          s = new Group({group: obj.group});
        }
        _.each(obj, function(val, key){
          s[key] = val;
        });
        if(s.users) {
          s.users = _.uniq(s.users);
        }
        if(!s.group) {
          s.group = s.group;
        }
        s.save(function(err){
          if(err) return liveAdmin.sendError(err);
          console.log('Group saved into database:', s.toString());
          // Global send to all clients
          io.emit('group init', s);
        });
      });
    });

    socket.on('reload remotes',function(){
      liveAdmin.sendFeed('Reloading all remote clients');
      // Emit back to all clients
      io.emit('reload page');
    });

    /* EVENTS FROM NOTES */

    var timeoutSlides = function(space, type, client) {
      client = client || clientId;
      var sendSlides = function(slide, notes) {
        try {clearTimeout(timeouts[client][space][0])} catch(e){};
        var time = slideInterval * ((slide && notes && notes.length) || 1);
        // var time = slideInterval;
        console.log('Done sending project Step',space,' Client',client,'Type', type,' Programming next sending in', time, 'seconds');
        timeouts[client][space] = [setTimeout(function(){
          liveSteps.sendSlides(space, type, sendSlides, clients[client]);
        }, time * 1000), type || 'filtered'];
      };
      liveSteps.sendSlides(space, type, sendSlides, clients[client]);
    };

    var resendAllFilteredSlides = function(space) {
      _.each(timeouts, function(spaces, client){
        _.each(spaces, function(timeout, sKey) {
          // console.log('Send to client',clients[client].request.headers.referer);
          // Send everybody, not to notes
          if(space === sKey) {
            console.log('Resending with type [%d] to space client %s, Step %d', timeout[1], client, sKey);
            timeoutSlides(space, timeout[1], client);
          }
        });
      });
    };

    // Slides editing
    socket.on('slide change', function(obj) {
      console.log('Slide change', obj);
      var add = obj && obj.add;
      var activate = obj && obj.activate;
      var edit = obj && obj.edit;
      Step.findOne({space:obj.space}, function(err, space) {
        if(err) return liveAdmin.sendError(err, true);
        Slide.findOne({space:obj.space}, function(err, slide) {
          if(err) return liveAdmin.sendError(err, true);
          if(!slide) {
            slide = new Slide({space:obj.space});
          }

          if(add) {
            // Note adding
            if(!add.text) {
              return liveAdmin.sendError('Missing text!', true);
            }
            if(add.userId == undefined) {
              return liveAdmin.sendError('Missing user!', true);
            }
            // Save chapter if present
            if(add.chapter && add.chapter_id) {
              // Add chapter if doesn't exist
              if(_.findWhere(slide.chapters, {id: parseInt(add.chapter_id, 10)}) == undefined) {
                slide.chapters.push({
                  id: add.chapter_id,
                  title: add.chapter
                });
              }
              // Activate chapter edited automatically
              _.each(slide.chapters, function(c,i) {
                slide.chapters[i].active = false;
                if(c.id == add.chapter_id) {
                  slide.chapters[i].active = true;
                }
              });
            }
            // Find user
            User.findOne({userId:add.userId}, function(err, user) {
              if(err) return liveAdmin.sendError(err, true);
              add.author = user.name;
              add.avatar = user.avatar;
              add.role = user.role;
              add.twitter = user.twitter;
              add.type = 'note';
              add.space = slide.space;
              add.space_id = slide._id;
              // add.group = slide.group;
              console.log('Adding note', add);
              Note.findOneAndUpdate(
                {_id: add.id || new mongoose.mongo.ObjectID()},
                add,
                {upsert: true},
                function(err){
                  if(err) return liveAdmin.sendError(err, true);
                  liveAdmin.sendSuccess('Added note "' + add.text + '" in Space ' + slide.space, true);
                  // Send filtered to clients
                  resendAllFilteredSlides(slide.space);
                }
                );
            });
          } else if(activate) {
            _.each(slide.chapters, function(c,i) {
              slide.chapters[i].active = false;
              if(c.id == activate) {
                slide.chapters[i].active = true;
              }
            });
          } else if(edit) {
            var i = _.findIndex(slide.chapters, {id: parseInt(edit.id, 10)});
            console.log('EDIT CHAPTER', edit, i);
            if(i === -1) {
              slide.chapters.push({
                id: edit.id,
                title: edit.title
              });
            } else {
              slide.chapters[i].title = edit.title;
            }
          } else {
            // Slide edit
            slide.show = obj.type;
            slide.chapter = obj.chapter;
          }
          // Save slide
          slide.save(function(err, slide){
            if(err) return liveAdmin.sendError(err, true);
            liveAdmin.sendSuccess('Now showing [' + slide.show + '] & [' + slide.chapter + '] in Step ' + slide.space, true);
            // Send filtered to clients
            resendAllFilteredSlides(slide.space);
          });
        });
      });
    });

    socket.on('note remove', function(obj) {
      console.log('Note remove', obj);
      // find slide
      Slide.findOne({space:obj.space}, function(err, slide){
        if(err) return liveAdmin.sendError(err, true);
        if(!slide) return liveAdmin.sendError('Not found space ' + obj.space, true);
        Note.remove({
          _id: obj.id
        }, function(err) {
          if(err) return liveAdmin.sendError(err, true);
          liveAdmin.sendSuccess('Removed note "' + obj.id + '" in Space ' + slide.space, true);
          // Send filtered to clients
          resendAllFilteredSlides(slide.space);
        });
      });
    });

    socket.on('space panic', function(step, panic){
      console.log('SPACE %d PANIC!!!', step);

      // Persist changes if configured mongo
      Step.findOne({step:step}, function(err, s){
        if(err) return liveAdmin.sendError(err);
        if(!s) {
          // Create new one
          s = new Step({step: step});
        }
        s.panic = !!panic;
        s.save(function(err){
          if(err) return liveAdmin.sendError(err);
          console.log('Step saved into database:', s.toString());
          // Global send to all clients
          io.emit('step init', s);
          if(s.panic) {
            liveAdmin.sendError('Panic request on Step ' + s.step +'!', false, {url:'/space'+s.step+'/notes'});
            liveAdmin.sendError('Help is on the way!', clientId);
          }
          else {
            liveAdmin.sendSuccess('Panic dismissed on Step ' + s.step, false, true);
            liveAdmin.sendSuccess('Okay. Everything under control?', clientId);
          }
        });
      });
    });

    /* EVENTS FROM SPACES */

    // Get slides for a individual client
    socket.on('get slides', function(step, type) {
      console.log('get slides for Step ', step);
      timeoutSlides(step, type);
    });

    socket.on('disconnect', function() {
      liveAdmin.sendFeed('Client ' + clientId + ' disconnected');
      delete clients[clientId];
      _.each(timeouts, function(spaces, client){
        if(client == clientId) {
          _.each(spaces, function(timeout, sKey) {
            try{clearTimeout(timeout[0])} catch(e){};
          });
        }
      });
    });
  });
};
