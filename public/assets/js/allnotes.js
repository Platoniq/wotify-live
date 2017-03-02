function addSlides(slides, step) {
  var valid = [];
  _.each(slides, function(slide) {
    var markup = '<li class="media" id="' + slide.id + '">' +
      '<div class="media-left">' +
        '<a href="#">' +  getHexagon(slide) + '</a>' +
      '</div>' +
      '<div class="media-body">' +
        '<h4 class="media-heading"><b class="userId">' + slide.userId + '</b> <span class="author">' + slide.author + '</span></h4>' +
        '<div class="text">' + slide.text + '</div>' +
      '</div>' +
      '<div class="media-right">' +
        '<a href="http://twitter.com/intent/tweet?text='+ slide.text +' by ' + slide.twitter + "><img src="/assets/img/social/twitter.svg" ></a>' +
      '</div>' +
    '</li>';
    if($('#tab-' + step + ' #' + slide.id).is('li')) {
      $('#tab-' + step + '  #' + slide.id).replaceWith(markup);
    } else {
      $('#tab-' + step + '  ul.media-list').prepend(markup);
    }
    valid.push(slide.id);
  });
  // Delete removed
  $('#tab-' + step + ' .ul.media-list li').each(function(){
    if($.inArray($(this).attr('id'), valid) === -1) {
      $(this).remove();
    }
  });
}

function initModel(obj, step) {
  var model = 'group';
  if(obj.step !== undefined) model = 'step';

  if(obj.users && obj.users.length) {
    $.getJSON('/api/users',{id:obj.users},function(users){
      console.log('set users for',model,step,obj.users,users);
      $('#tab-' + step + ' .' + model + '-users .users').html('');
      if(model=="group")
        $('#tab-' + step + ' .' + model + '-users > h4').html('Group ' + obj.group );
      else
        $('#tab-' + step + ' .' + model + '-users > h4').html('Idea Feeders & Facilitators');
      _.each(users,function(u){
        console.log('ADD',u);
        if(model=="group")
          $('#tab-' + step + ' .' + model + '-users .users').append('<div class="pull-left">'+getHexagon(u,1)+'</div>');
        else
          $('#tab-' + step + ' .' + model + '-users .users').append('<div class="pull-left">'+getHexagon(u,1)+'</div>');
      });
    });
  }

}

function initGroup(group) {
  console.log('Applying Init group for ',group);
  $('li.step').each(function(){
    var step = $(this).data('step');
    var g = $(this).data('group');
    if(group.group == g) {
      initModel(group, step);
    } else if( !$(this).hasClass('initialized') ) {
      console.log('Delaying initGroup ',g,group);
      setTimeout(function(){
        initGroup(group);
      }, 1000);
    }
  });
}

SOCKET.on('group init', initGroup);

SOCKET.on('step init', function(step){
  console.log('step init',step);
  if(step.group) $('li.step.step-' + step.step).data('group', step.group);
  $('li.step.step-' + step.step).addClass('initialized');
  initModel(step, step.step);
  // Ask for slides
  SOCKET.emit('get slides', step.step);
  // Write data
  SOCKET.on('slides step ' + step.step, function(slide) {
    $('body').loading('stop');

    console.log('get slide',slide)
    var notes = _.filter(slide.slides, function(s){
      return s.type === 'note';
    });
    console.log('notes',notes, slide.slides);

    // Set totals
    $('li[data-step=' + step.step+ '] .total-notes').text(parseInt(notes.length,10));

    addSlides(notes || [], step.step);

  });
});

$(function(){
  $('body').loading();
});

