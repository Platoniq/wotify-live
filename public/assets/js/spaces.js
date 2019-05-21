PROJECTS=[];
AJAXS={};

function initModel(obj) {
  var model = 'group';
  if(obj.step !== undefined) model = 'step';

  // This changes only on step models
  if(obj.step && obj.group) {
    GROUP=obj.group;
    $('.group').html(' Group<br>' + obj.group);
  }
  if(model !== 'step' || obj.group) {
    $('.with-group').removeClass('hidden');
  }

  // Set users
  $('#' + model + '-users').html('');
  if(AJAXS[model]) AJAXS[model].abort();
  if(obj.users && obj.users.length) {
    AJAXS[model] = $.getJSON('/api/users',{id:obj.users},function(users){
      console.log('set users for',model,obj.users,users);
        if(model=="group")
          $('#' + model + '-users').html('');
        else
          $('#' + model + '-users').html('<h2>' + TEXTS.facilitators + '</h2>');
      _.each(users,function(u){
        // TODO: format this
        if(model=="group")
          $('#' + model + '-users').append(getHexagon(u,1,1));
        else
          $('#' + model + '-users').append(getHexagon(u,1));
      });
    });
  }

  // Put current values on place
  _.each(obj, function(val, key) {
    if(key != 'step' && key != 'group' && key != 'users')
      $('#'+ model + '-prop-' + key).text(val);
  });
  console.log('Initialized ',model);
  if(model === 'step') {
    console.log(obj.step,' asking for slides');
    SOCKET.emit('get slides', obj.step);
    $('.spinning').show();
  }
}

function addSlides(slides){

  var total = $('#stepsSlider > div').length;

  var index = 0;
  _.each(slides, function(slide) {
    // console.log('ADDING SLIDE',index, slide);
    // TODO: split texts
    if(slide.text) {
        var item = '';
        var text=  '';
        item += '<div>';

        if(SPACE!=0)
          text=$.truncate(slide.text, {
                    length: 250
                });
        else
          text=$.truncate(slide.text, {
                    length: 400
              });
        //if(index === 0 && total === 0)
            //item += ' active';
        //item += '" id="' + slide.id + '" data-index="' + (total + index) + '">';
        item += '<p class="text-center">' // Class "text" breaks lines with \n
        item += text;
        item += '</p>';
        item += '<div class="text-center">';
        item += getHexagon(slide);
        item += ' <span style="font-size:16px">' + slide.author + '<span>'
        item += '</div>';
        item += '</div>';
        $('#stepsSlider').prepend(item);

        // $('#stepsSlider').slick('slickAdd', item);

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
  console.log('Received init event for step ',step,'Current Space', SPACE);
  if(SPACE === step.step) {
    console.log('Applying Init step for ',step);
    initModel(step);
  }
});

SOCKET.on('group init', function(group) {
  console.log('Received init event for group ',group.group,'Current Space', GROUP);
  if(GROUP === group.group) {
    console.log('Applying Init group for ',group);
    initModel(group);
  }
});

CURRENT_TIMEOUT = null;

function startSlides(){
  try{clearTimeout(CURRENT_TIMEOUT);}catch(e){};
  var $el = $('#stepsSlider > div:visible');
  $el.fadeOut(function(){
    if($(this).next().is('div')) {
      $(this).next().fadeIn(function(){
        CURRENT_TIMEOUT = setTimeout(startSlides, SLIDE_INTERVAL * 1000);
      });
    }
    else {
      $('#stepsSlider > div:first').fadeIn(function(){
        CURRENT_TIMEOUT = setTimeout(startSlides, SLIDE_INTERVAL * 1000);
      });
    }
  })
}

SOCKET.on('notes space ' + SPACE, function(slide, notes) {
  try{clearTimeout(CURRENT_TIMEOUT);}catch(e){};
  $('.spinning').hide();
  $('#stepsSlider').html('');
  console.log('Adding notes', notes);
  addSlides(notes || []);
  if($('#stepsSlider > div:visible').is('div')) {
    $('#stepsSlider > div:visible').fadeOut(function(){
      $('#stepsSlider > div:first').fadeIn(function(){
        CURRENT_TIMEOUT = setTimeout(startSlides, SLIDE_INTERVAL * 1000);
      });
    });
  } else {
    $('#stepsSlider > div:first').fadeIn(function(){
      CURRENT_TIMEOUT = setTimeout(startSlides, SLIDE_INTERVAL * 1000);
    });
  }

});

