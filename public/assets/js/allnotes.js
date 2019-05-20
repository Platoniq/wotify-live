function addSlides(slides, step) {
  var valid = [];
  _.each(slides, function(slide) {
    var twitter = slide.twitter ? '&via=' + slide.twitter : '' ;

    var markup = '<li class="media" id="' + slide.id + '">' +
      '<div class="media-left">' +
        '<a href="#">' +  getHexagon(slide) + '</a>' +
      '</div>' +
      '<div class="media-body">' +
        '<h4 class="media-heading"><b class="userId">' + slide.userId + '</b> <span class="author">' + slide.author + '</span>' +
        (slide.group ? '<span class="badge pull-right">Group ' + slide.group + '</span>' : '') +
        '</h4>' +
        '<div class="text">' + slide.text + '</div>' +
        '<div class="date">' +  (new Date(slide.created_at)).toLocaleString() + '</div>' +
      '</div>' +
      '<div class="media-right">' +
        '<a href="http://twitter.com/intent/tweet?text='+ encodeURI(slide.text) + '&hashtags=IdeaCamp17' + twitter + '"><img src="/assets/img/social/twitter.svg" ></a>' +
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
  // hide without groups
  if(model === 'step' && !obj.group) {
    // console.log(model, obj, $('.nav-tabs li.step.step-' + step))
    $('.nav-tabs li.step.step-' + step).hide();
  }

  if(obj.users && obj.users.length) {
    $.getJSON('/api/users',{id:obj.users},function(users){
      // console.log('set users for',model,step,obj.users,users);
      $('#tab-' + step + ' .' + model + '-users .users').html('');
      if(model=="group")
        $('#tab-' + step + ' .' + model + '-users > h4').html('Current group ' + obj.group );
      else
        $('#tab-' + step + ' .' + model + '-users > h4').html('Idea Feeders & Facilitators');
      _.each(users,function(u){
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
  console.log('space init',step);
  if(step.group) $('li.step.step-' + step.step).data('group', step.group);
  $('li.step.step-' + step.step).addClass('initialized');
  initModel(step, step.step);
  // Ask for slides
  SOCKET.emit('get slides', step.step);
  // Write data
  SOCKET.on('notes space ' + step.step, function(slide) {
    $('body').loading('stop');

    console.log('get slide',slide)
    var notes = _.filter(slide.notes, function(s){
      return s && s.type === 'note';
    });
    // console.log('notes',notes, slide.notes);

    // Set totals
    $('li[data-step=' + step.step+ '] .total-notes').text(parseInt(notes.length,10));

    addSlides(notes || [], step.step);

  });
});

function processHash() {
  var hash = window.location.hash;
  var $tab = $('a[href="' + hash + '"]');
  if($tab.is('a')) {
    var step = $tab.parent().data('step');
    $tab.tab('show');
    $('nav.step').attr('class', 'step step' +  step);
  } else {
    window.location.hash = '#tab-1';
  }
}

$(function(){
  $('body').loading();

  // Hashchange
  processHash();
  $(window).bind( 'hashchange', processHash);

});

