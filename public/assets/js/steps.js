PROJECTS=[];
INTERVAL=6000;

function initStep(step) {
  GROUP=step.group;
  $('.group').html(' Group<br>' + step.group);
  // Put current values on place
  _.each(step, function(val, key){
    if(key != 'step' && key != 'group')
      $('#' + key).text(val);
  });
  console.log('Initialized step', step.step,' asking for slides');
  SOCKET.emit('get slides', step.step);
  $('.spinning').show();
}

function addSlides(projects){
  var total = $('#stepsCarousel .item').length;

  var index = 0;
  _.each(projects, function(project) {
    //- console.log(index, project);
    // TODO: split texts
    if(project.text) {
        var item = '';
        item += '<div class="item';
        if(index === 0 && total === 0)
            item += ' active';
        item += '" id="' + project.id + '" data-index="' + (total + index) + '">';
        item += '<p class="text-center">'
        item += project.text;
        item += '</p>';
        item += '<div class="text-center">'
        item += '<div class="avatar hexagon" style="background-image:url(' + project.avatar + ')"><div class="hex-top"></div><div class="hex-bottom"></div><div class="role role-' + project.role + '"></div></div>';
        item += ' <span style="font-size:16px">' + project.author + '<span>'
        item += '</div>'
        item += '</div>';
        $('#stepsCarousel>.carousel-inner').append(item);

        //- var indicators = '';
        //- indicators += '<li data-target="#stepsCarousel" data-slide-to="' + index + '"';
        //- if(index === 0 && total === 0)
        //-     indicators += ' class="active"';
        //- indicators += '></li>';
        //- $('#stepsCarousel>.carousel-indicators').html(indicators);
        index++;
    }
  });
}

/* SOCKET ACTIONS */
SOCKET.on('step init', function(step) {
  console.log('Received init event for step ',step.step,'Current Step', STEP);
  if(STEP === step.step) {
    console.log('Applying Init step for ',step);
    initStep(step);
  }
});

SOCKET.on('start projects step ' + STEP, function() {
  console.log('Initializind slides');
  PROJECTS=[];
});

SOCKET.on('projects step ' + STEP, function(projects) {
  if(projects && projects.length) {
    console.log('Adding', projects.length, 'projects', projects);
    // addSlides(projects);
    PROJECTS = _.union(PROJECTS, projects);
  }
});
SOCKET.on('end projects step ' + STEP, function(projects) {
  $('.spinning').hide();
  $('#stepsCarousel').carousel('pause');
  $('#stepsCarousel').carousel(0);
  $('#stepsCarousel').removeData();
  $('#stepsCarousel>.carousel-inner').html('');
  console.log('Adding projects', PROJECTS);
  addSlides(PROJECTS);
  $('#stepsCarousel').carousel('cycle');
});

$(function(){
  $('#stepsCarousel').carousel({
    interval: INTERVAL,
    pause: null,
    keyboard: false
  });

  // $('#stepsCarousel').on('slid.bs.carousel', function (target) {
  //   var index = $(target.relatedTarget).data('index');
  //   var total = $('#stepsCarousel .item').length;
  //   console.log('end sliding, carousel total', total, 'current index',index);
  //   if(index >= total - 1) {
  //     // Final slide, request more
  //     console.log('End slides step', STEP);
  //     SOCKET.emit('end slides', STEP);
  //   }
  // });


});
