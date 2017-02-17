$(function(){
      var socket = io();
      $("#add_status").click(function(){
        socket.emit('status added',$("#comment").val());
      });
      socket.on('refresh feed',function(msg){
        $("#show_comments").append(msg + '<br /><br />');
      });
      socket.on('refresh page',function(page){
        location = page;
      });
});