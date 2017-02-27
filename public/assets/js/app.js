
// Global var
SOCKET = io();
AUTORELOAD = true;

// Common tasks
SOCKET.on('reload page',function(page){
  if(AUTORELOAD) {
    location.reload();
  }
});

// Notifications
function showSuccess(txt) {
  $.notify(txt, {
    type:'success',
    animate: {
      enter: 'animated bounceInDown',
      exit: 'animated bounceOutUp'
    }
  });
}
function showError(txt) {
  $.notify(txt, {
    type:'danger',
    animate: {
      enter: 'animated bounceInDown',
      exit: 'animated bounceOutUp'
    }
  });
}
function showInfo(txt) {
  $.notify(txt, {
    type:'info',
    animate: {
      enter: 'animated bounceInDown',
      exit: 'animated bounceOutUp'
    }
  });
}
function showWarning(txt) {
  $.notify(txt, {
    type:'warning',
    animate: {
      enter: 'animated bounceInDown',
      exit: 'animated bounceOutUp'
    }
  });
}

function getHexagon(user) {
  return '<div class="avatar hexagon" style="background-image:url(' + user.avatar + ')" title="' + user.title + '"><div class="hex-top"></div><div class="hex-bottom"></div><div class="role role-' + user.role + '"></div></div>';
}
