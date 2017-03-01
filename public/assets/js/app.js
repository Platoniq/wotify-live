
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

function showMsg(txt, type, delay, push) {
  $.notifyClose();

  $.notify(txt, {
    type: type || 'info',
    delay: delay || 5000,
    animate: {
      enter: 'animated bounceInDown',
      exit: 'animated bounceOutUp'
    }
  });
  if(push) {
    Push.create(push.title || (type === 'success' ? 'No worries' : 'Heads up!'), {
        body: $($.parseHTML(txt)).text(),
        icon: push.icon || '/assets/img/panic.svg',
        timeout: push.delay || delay,
        onClick: function () {
          window.focus();
          this.close();
        }
    });
  }
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

function getHexagon(user, show_id, show_name) {
  var avatar='<div class="avatar hexagon" style="background-image:url(' + user.avatar + ')" title="' + user.title + '"><div class="hex-top"></div><div class="hex-bottom"></div>';
  if(show_id)
    avatar+='<div class="role show-id">' + user.id  +'</div>';
  else
    avatar+='<div class="role role-' + user.role + '"></div>';

  if(show_name)
    avatar+='<div class="text-center" style="font-size:12px; position: absolute; top: 65px;">' + user.name + '</div>';

  avatar+='</div>';
  return avatar;
}


function toggleFullscreen() {
  if($.fullscreen.isFullScreen()) {
    $.fullscreen.exit();
  }
  else {
    $('html').fullscreen();
  }
}

$(function(){
  if(FULLSCREEN) {
    $("body").keypress(function(e){
        // alert(e.which);
        if(e.which == 102) toggleFullscreen();
    });
    $('body').on('click', '.goto-fullscreen', toggleFullscreen);
    showInfo('Press "f" for awesomeness', 1000);
  }
});
