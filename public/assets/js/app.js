
// Global var
SOCKET = io();
AUTORELOAD = true;
FULLSCREEN = true;

// Common tasks
SOCKET.on('reload page',function(page){
  if(AUTORELOAD) {
    location.reload();
  }
});

function showMsg(txt, type, delay) {
  $.notify(txt, {
    type: type || 'info',
    delay: delay || 5000,
    animate: {
      enter: 'animated bounceInDown',
      exit: 'animated bounceOutUp'
    }
  });
}

// Notifications
function showSuccess(txt, delay) {
  showMsg(txt, 'success', delay);
}
function showError(txt, delay) {
  showMsg(txt, 'danger', delay);
}
function showInfo(txt, delay) {
  showMsg(txt, 'info', delay);
}
function showWarning(txt, delay) {
  showMsg(txt, 'warning', delay);
}

function getHexagon(user) {
  return '<div class="avatar hexagon" style="background-image:url(' + user.avatar + ')" title="' + user.title + '"><div class="hex-top"></div><div class="hex-bottom"></div><div class="role role-' + user.role + '"></div></div>';
}


function toggleFullscreen() {
  if($.fullscreen.isFullScreen()) {
    $.fullscreen.exit();
  }
  else if(FULLSCREEN) {
    $('html').fullscreen();
  }
}

$(function(){
  $("body").keypress(function(e){
      // alert(e.which);
      if(e.which == 102) toggleFullscreen();
  });
  $('body').on('click', '.goto-fullscreen', toggleFullscreen);
  showInfo('Press "f" for awesomeness', 1000);
});
