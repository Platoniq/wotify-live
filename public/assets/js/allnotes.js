function addNote(note, container) {
  var twitter = note.twitter ? '&via=' + note.twitter : '' ;

  var markup = '<li class="media" id="' + note._id + '">' +
    '<div class="media-left">' +
      '<a href="#">' +  getHexagon(note) + '</a>' +
    '</div>' +
    '<div class="media-body">' +
      '<h4 class="media-heading"><b class="userId">' + note.userId + '</b> <span class="author">' + note.author + '</span>' +
      (note.group ? '<span class="badge pull-right">Group ' + note.group + '</span>' : '') +
      // (note.chapter ? '<span class="badge pull-right">' + note.chapter + '</span>' : '') +
      '</h4>' +
      '<div class="text">' + note.text + '</div>' +
      '<div class="date">' +  (new Date(note.created_at)).toLocaleString() + '</div>' +
    '</div>' +
    '<div class="media-right">' +
      '<a href="http://twitter.com/intent/tweet?text='+ encodeURI(note.text) + '&hashtags=' + HASHTAGS + twitter + '"><img src="/assets/img/social/twitter.svg" ></a>' +
    '</div>' +
  '</li>';
  if($(container + ' #' + note._id).is('li')) {
    $(container + '  #' + note._id).replaceWith(markup);
  } else {
    $(container).prepend(markup);
  }
}

function addNotes(notes, step) {
  var valid = [];

  var grouped = _.groupBy(notes, 'chapter_id');
  // console.log('grouped', grouped);
  _.each(grouped, function(group) {
    // Create zone
    var chapter_id = group[0].chapter_id || '0';
    var chapter = group[0].chapter || '';
    var active = !!group[0].active;
    console.log('chapter', chapter_id, chapter);
    if($('#media-' + step).length) {
      var markup = (chapter ? '<h4 id="title-' + step + '-' + chapter_id + '">' + chapter + '</h4>' : '' ) + '<ul class="media-list well well-sm" id="chapter-' + step + '-' + chapter_id + '"></ul>';
      if($('#chapter-' + step + '-' + chapter_id).length) {
        console.log('Update UL container')
        $('#title-' + step + '-' + chapter_id).text(chapter);
      } else {
        console.log('Create UL container');
        $('#media-' + step).append(markup)
      }
      // Add notes to the proper container
      _.each(group, function(note) {
        addNote(note, '#chapter-' + step + '-' + chapter_id);
        valid.push(note._id);
      });
    } else {
      console.error('Media container not found for step', step);
    }
  });
  // Delete removed
  // console.log('valid', valid);
  $('#media-' + step + ' ul.media-list li').each(function(){
    if($.inArray($(this).attr('id'), valid) === -1) {
      $(this).remove();
    }
  });
  // Delete empty ul
  $('#media-' + step + ' ul.media-list:empty').each(function(){
    if($(this).prev().is('h4')) $(this).prev().remove();
    $(this).remove();
  });
}

function initModel(obj, step) {
  var model = 'group';
  if(obj.step !== undefined) model = 'step';
  // hide without groups
  if(model === 'step' && !obj.group) {
    // console.log(model, obj, $('.nav-tabs li.step.step-' + step))
    console.log("HIDDING NON GRUP STEP", obj);
    $('.nav-tabs li.step.step-' + step).hide();
  }

  if(obj.users && obj.users.length) {
    $.getJSON('/api/users',{id:obj.users},function(users){
      // console.log('set users for',model,step,obj.users,users);
      $('#tab-' + step + ' .' + model + '-users .users').html('');
      if(model=="group")
        $('#tab-' + step + ' .' + model + '-users > h4').html('Current group ' + obj.group );
      else
        $('#tab-' + step + ' .' + model + '-users > h4').html(TEXTS.facilitators);
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
  SOCKET.on('notes space ' + step.step, function(slide, notes) {
    $('body').loading('stop');

    if(notes && notes.length)
      console.log('get slide',slide, 'NOTES',notes)
    notes = _.filter(notes, function(s){
      return s && s.type === 'note';
    });
    // console.log('notes',notes, notes);

    // Set totals
    $('li[data-step=' + step.step+ '] .total-notes').text(parseInt(notes.length,10));

    addNotes(notes || [], step.step);
    // Update active status
    _.each(slide.chapters, function(c){
      $('#title-' + step.step + '-' + c.id + '>span').remove();
      if(c.active)
        $('#title-' + step.step + '-' + c.id).append('<span class="label label-danger pull-right">Active</span>');
    });


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

