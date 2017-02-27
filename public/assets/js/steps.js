PROJECTS=[];
AJAXS={};

function initModel(obj) {
  var model = 'group';
  if(obj.step) model = 'step';

  // This changes only on step models
  if(obj.step && obj.group) {
    GROUP=obj.group;
    $('.group').html(' Group<br>' + obj.group);
  }

  // Set users
  $('#' + model + '-users').html('');
  if(AJAXS[model]) AJAXS[model].abort();
  if(obj.users && obj.users.length) {
    AJAXS[model] = $.getJSON('/api/users',{id:obj.users},function(users){
      console.log('set users for',model,obj.users,users);
        if(model=="group")
          $('#' + model + '-users').html('<h2>Idea Makers</h2>');
        else
          $('#' + model + '-users').html('<h2>Idea Feeders & Facilitators</h2>');
      _.each(users,function(u){
        // TODO: format this
        $('#' + model + '-users').append(getHexagon(u));
      });
    });
  }

  // Put current values on place
  _.each(obj, function(val, key){
    if(key != 'step' && key != 'group' && key != 'users')
      $('#' + key).text(val);
  });
  console.log('Initialized ',model);
  if(obj.step && obj.group) {
    console.log(obj.step,' asking for slides');
    SOCKET.emit('get slides', obj.step);
    $('.spinning').show();
  }
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
        item += '<p class="text-center text">' // Class "text" breaks lines with \n
        item += slide.text;
        item += '</p>';
        item += '<div class="text-center">'
        item += getHexagon(slide);
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
    initModel(step);
  }
});

SOCKET.on('group init', function(group) {
  console.log('Received init event for group ',group.group,'Current Step', GROUP);
  if(GROUP === group.group) {
    console.log('Applying Init group for ',group);
    initModel(group);
  }
});

SOCKET.on('slides step ' + STEP, function(slide) {
  var slides = slide && slide.slides;
  $('.spinning').hide();
  $('#stepsCarousel').carousel('pause');
  $('#stepsCarousel').carousel(0);
  $('#stepsCarousel').removeData();
  $('#stepsCarousel>.carousel-inner').html('');
  console.log('Adding slides', slides);
  addSlides(slides || []);
  $('#stepsCarousel').carousel('cycle');
});

$(function(){
  $('#stepsCarousel').carousel({
    interval: SLIDE_INTERVAL * 1000,
    pause: null,
    keyboard: false
  });
});
