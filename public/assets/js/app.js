
// Global var
SOCKET = io();
AUTORELOAD = true;

// Common tasks
SOCKET.on('reload page',function(page){
  if(AUTORELOAD) {
    location.reload();
  }
});
