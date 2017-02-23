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

function addSlides(slides){
  var total = $('#stepsCarousel .item').length;

  var index = 0;
  _.each(slides, function(slide) {
    //- console.log(index, slide);
    // TODO: split texts
    if(slide.text) {
        var item = '';
        item += '<div class="item';
        if(index === 0 && total === 0)
            item += ' active';
        item += '" id="' + slide.id + '" data-index="' + (total + index) + '">';
        item += '<p class="text-center">'
        item += slide.text;
        item += '</p>';
        item += '<div class="text-center">'
        item += '<div class="avatar hexagon" style="background-image:url(' + slide.avatar + ')"><div class="hex-top"></div><div class="hex-bottom"></div><div class="role role-' + slide.role + '"></div></div>';
        item += ' <span style="font-size:16px">' + slide.author + '<span>'
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

SOCKET.on('slides step ' + STEP, function(slides) {
  if(slides && slides.length) {
    $('.spinning').hide();
    $('#stepsCarousel').carousel('pause');
    $('#stepsCarousel').carousel(0);
    $('#stepsCarousel').removeData();
    $('#stepsCarousel>.carousel-inner').html('');
    console.log('Adding slides', slides);
    addSlides(slides);
    $('#stepsCarousel').carousel('cycle');
  }
});

$(function(){
  $('#stepsCarousel').carousel({
    interval: INTERVAL,
    pause: null,
    keyboard: false
  });
});
