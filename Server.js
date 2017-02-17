var express   = require("express");
var app       = express();
var http      = require('http').Server(app);
var io        = require("socket.io")(http);
var pug       = require('pug');
var less      = require('less-middleware');
var routes    = require('lib/routes.js');

// Setup template engine
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
// Autocompile less
app.use(less(__dirname + '/public', {debug:true}));

// Add routes
app.use('/', routes);

// Handle public assets
app.use(express.static(__dirname + '/public'));


/*  This is auto initiated event when Client connects to Your Machien.  */

io.on('connection',function(socket){
    console.log("A user is connected");
    socket.on('status added',function(status){
      add_status(status,function(res){
        if(res){
            io.emit('refresh feed',status);
        } else {
            io.emit('error');
        }
      });
    });
    setTimeout(function(){
      io.emit('refresh feed','Test ' + new Date());
    }, 1000);
    setTimeout(function(){
      io.emit('refresh feed','Test ' + new Date());
    }, 2000);
});

var add_status = function (status,callback) {
  console.log('add status',status);
    pool.getConnection(function(err,connection){
        if (err) {
          callback(false);
          return;
        }
    connection.query("INSERT INTO `status` (`s_text`) VALUES ('"+status+"')",function(err,rows){
            connection.release();
            if(!err) {
              callback(true);
            }
        });
     connection.on('error', function(err) {
              callback(false);
              return;
        });
    });
}

http.listen(3000,function(){
    console.log("Listening on 3000");
});
