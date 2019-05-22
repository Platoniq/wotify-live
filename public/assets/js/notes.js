FULLSCREEN=false;

/* SOCKET ACTIONS */

function addNotes(notes) {
  var valid = [];
  var totals = {api:0,note:0};
  _.each(notes, function(slide) {
    var markup = '<li class="media" id="' + slide._id + '" data-chapter-id="' + slide.chapter_id + '">' +
      '<div class="media-left">' +
        '<a href="#">' +  getHexagon(slide) + '</a>' +
      '</div>' +
      '<div class="media-body">' +
        '<h4 class="media-heading"><b class="userId">' + slide.userId + '</b> <span class="author">' + slide.author + '</span>' +
        '<span class="pull-right text-right chapter-badge">' +
        (slide.chapter ? '<span class="badge' + ( $('#note-chapter').val() == slide.chapter_id ? ' active' : '') + '">' + slide.chapter + '</span>' : '') +
        '</span>' +
        '</h4>' +
        '<div class="text">' + slide.text + '</div>' +
        '<div class="pull-right text-right">' +
          (slide.group ? '<span class="badge">Group ' + slide.group + '</span>' : '') +
          (slide.type === 'note' ? '<span class="btn-group"><button title="Edit note" class="note-edit btn btn-sm btn-primary"><span class="glyphicon glyphicon-edit"></span></button><button title="Remove note" class="note-remove btn btn-sm btn-danger"><span class="glyphicon glyphicon-trash"></span></button></span>' : '<button title="Copy note" class="btn btn-sm btn-success note-copy"><span class="glyphicon glyphicon-copy"></span></button>' ) +
        '</div>' +
        '</span>' +
        '<div class="date">' +  (new Date(slide.created_at)).toLocaleString() + '</div>' +
      '</div>' +
    '</li>';
    if($('#' + slide.type + ' #' + slide._id).is('li')) {
      $('#' + slide.type + ' #' + slide._id).replaceWith(markup);
    } else {
      $('#' + slide.type + ' ul.media-list').prepend(markup);
    }
    totals[slide.type] = (totals[slide.type] || 0) + 1;
    valid.push(slide._id);
  });
  // Delete removed
  $('ul.media-list li').each(function(){
    if($.inArray($(this).attr('id'), valid) === -1) {
      $(this).remove();
    }
  });

  // Set totals
  _.each(totals, function(val, key){
    // console.log('SET TOTAL #total-'+key,':',val);
    $('#total-' + key).text(val);
  });
}

function updateSlide(slide) {
  // update selects
  $('#show-chapter option').each(function(){
    var $o = $(this);
    if($o.val() == '_all_' || $o.val() == '_active_' || !$o.val())
      return;
    var $c = $('#note-chapter option[value="' + $o.val() + '"]');
    var c = _.findWhere(slide.chapters, {id: parseInt($o.val(),10)});
    if(c) {
      if(c.title != $o.text()) {
        console.log('UPDATE', c);
        $o.text(c.title);
        $c.text(c.title);
        $('#note-chapter').select2('destroy');
        $('#note-chapter').select2(select2_chapters);
      }
    } else {
      console.log('REMOVE!', $o.val(), $o.text());
      $c.remove();
      $o.remove();
      $('#note-chapter').trigger('change');
    }
  });
  // add missing
  _.each(slide.chapters, function(c) {
    var $o = $('#show-chapter option[value="' + c.id + '"]');
    var $c = $('#note-chapter option[value="' + c.id + '"]');
    if(!$o.length)
      $('#show-chapter').append('<option value="' + c.id + '">' + c.title + '</option>');
    if(!$c.length) {
      $('#note-chapter').append('<option value="' + c.id + '">' + c.title + '</option>');
      $('#note-chapter').trigger('change');
    }
  });

  if(slide && slide.show) {
    $('#show-type').val(slide.show);
  }
  if(slide && slide.chapter) {
    $('#show-chapter').val(slide.chapter);
  }

  var c = _.findWhere(slide.chapters, { active: true });
  if(c && c.id) {
    console.log('Active chapter', c);
    $('#note-chapter').val(c.id);
    $('#note-chapter').trigger('change');
  }
}
function initModel(obj) {
  var model = 'group';
  if(obj.step !== undefined) model = 'step';

  if(obj.users && obj.users.length) {
    $.getJSON('/api/users',{id:obj.users},function(users){
      // console.log('set users for',model,obj.users,users);
      $('#' + model + '-users .users').html('');
      if(model=="group")
        $('#' + model + '-users > h4').html('Group ' + obj.group );
      else
        $('#' + model + '-users > h4').html(TEXTS.facilitators);
      _.each(users,function(u){
        if(model=="group")
          $('#' + model + '-users .users').append('<div class="pull-left">'+getHexagon(u,1)+'</div>');
        else
          $('#' + model + '-users .users').append('<div class="pull-left">'+getHexagon(u,1)+'</div>');
      });
    });
  }

}

SOCKET.on('notes space ' + SPACE, function(slide, notes) {
  $('body').loading('stop');

  $('.spinning').hide();

  console.log('Adding slides & notes', slide);
  updateSlide(slide);
  if($('ul.media-list').hasClass('assign')) {
    console.log('SKIPPING REFRESH IN ASSIGN MODE');
    return;
  }
  addNotes(notes || []);
});

SOCKET.on('step init', function(step) {
  if(SPACE === step.step) {
    GROUP=step.group;
    console.log('Received init event for step ',step.step,'Current Step', SPACE);
    // If panic, show icon
    if(step.panic) {
      $('.icon-panic').addClass('blink');
    } else {
      $('.icon-panic').removeClass('blink');
    }
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


SOCKET.on('failure', function(msg) {
  $.notifyClose();
  showError(msg);
});

SOCKET.on('success', function(msg) {
  showSuccess(msg);
  $('#note-text').val('');
  $('#note-user').html('');
  $('#note-id').val('');
});


/* JQUERY ACTIONS */

var select2_chapters = {
  selectOnClose: true,
  width: '100%',
  placeholder: "Select a chapter",
  tags: true,
  createTag: function (params) {
    var term = $.trim(params.term);

    if (term === '') {
      return null;
    }
    var n = {
      id: new Date().getUTCMilliseconds(),
      text: term
    }
    // TODO: add to show select and chapter editor
    return n;
  }
};

var select2_users = {
  width: '100%',
  ajax: {
    url: '/api/users',
    dataType: 'json',
    delay: 250,
    processResults: function (data) {
      return {
        results: data
      };
    },
  },
  selectOnClose: true,
  placeholder: "Select an user",
  escapeMarkup: function (markup) { return markup; },
  minimumInputLength: 1,
  templateSelection: function(item) {
    return '<b>' + item.id + '</b> ' + (item.name || item.text);
  },
  templateResult: function(item) {
    if (item.loading) return item.name;
    var markup = "<div class='select2-result-repository clearfix'>" +
      "<div class='select2-result-repository__avatar'>" + getHexagon(item) + "</div>" +
      "<div class='select2-result-repository__meta'>" +
      "<div class='select2-result-repository__title'><b>" + item.id + '</b> ' + item.name + "</div>";

    // if (repo.bio) {
    //   markup += "<div class='select2-result-__description'>" + repo.bio + "</div>";
    // }

    markup += "</div></div>";

    return markup;
  },
};
$(function(){
  // Set loading initial status

  console.log('Asking for slides');
  $('body').loading();
  SOCKET.emit('get slides', SPACE, 'all');


  $('#note-chapter').select2(select2_chapters);
  $('#note-user').select2(select2_users);
  $('#note-user').on('select2:close', function(){
    $('#note-text').select();
  });

  // Live/dynamic event handler
  $('ul.media-list').on('click', '.note-edit', function(e){
    e.preventDefault();
    $(this).closest('li').addClass('editing');
    var id = $(this).closest('li').attr('id');
    var chapterId = $(this).closest('li').data('chapter-id');
    var userId = $(this).closest('li').find('.userId').text();
    var author = $(this).closest('li').find('.author').text();
    var text = $(this).closest('li').find('.text').text();
    console.log('EDIT id', id, 'chapterId', chapterId, 'userId', userId, 'author', author, 'text', text);
    $('#note-chapter').val(chapterId);
    $('#note-chapter').trigger('change');
    $('#note-user').html('').append('<option value="' + userId + '" selected>' + author + '</option>');
    $('#note-id').val(id);
    $('#note-text').val(text).focus();
  });

  $('ul.media-list').on('click', '.note-remove', function(e){
    e.preventDefault();
    var id = $(this).closest('li').attr('id');

    SOCKET.emit('note remove', {space:SPACE,id:id});
  });

  $('ul.media-list').on('click', '.note-copy', function(e){
    e.preventDefault();
    var userId = $(this).closest('li').find('.userId').text();
    var author = $(this).closest('li').find('.author').text();
    var text = $(this).closest('li').find('.text').text();
    // console.log('EDIT', id, userId, author, text);
    $('#note-user').html('').append('<option value="' + userId + '" selected>' + author + '</option>');
    $('a[href="#note"]').tab('show');
    $('#note-text').val(text).focus();
  });

  // Form submit
  $('#note form').on('submit', function(e){
    e.preventDefault();
    var obj = {
      space: SPACE,
      add: {
        userId: $('#note-user').val(),
        text: $('#note-text').val(),
        id: $('#note-id').val(),
        chapter_id: $('#note-chapter').val(),
        chapter: $('#note-chapter option:selected').text()
      }
    };
    // console.log('Send form', obj);
    SOCKET.emit('slide change', obj);
    $('#note ul.media-list li').removeClass('editing');
  });

  $('#note form').on('reset', function(){
    $('#note-text').val('');
    $('#note-user').html('');
    $('#note-id').val('');
    $('#note ul.media-list li').removeClass('editing');
  });

  // Chapter editor
  $('#chapter-activate').on('click', function() {
    var id = $('#note-chapter').val();
    console.log('Activate chapter', id);
    $('.chapter-badge>.badge.active').removeClass('active');
    $('[data-chapter-id="' + id + '"] .chapter-badge>.badge').addClass('active');
    SOCKET.emit('slide change', {space: SPACE, activate: id});
  });

  $('#chapter-edit').on('click', function() {
    var chapter_id = $('#note-chapter').val();
    var chapter = $('#note-chapter option:selected').text();
    console.log('EDIT', chapter_id, chapter);
    eModal
      .prompt({title: "Edit chapter name", value: chapter})
      .then(function(msg) {
        SOCKET.emit('slide change', {space: SPACE, edit: {id: chapter_id, title: msg}});
        // showSuccess('Set <strong>'+target+'</strong> to <em>'+msg+'</em>');
      });
  });

  $('#chapter-remove').on('click', function() {
    var chapter_id = $('#note-chapter').val();
    var chapter = $('#note-chapter option:selected').text();
    console.log('REMOVE', chapter_id, chapter);
    SOCKET.emit('slide change', {space: SPACE, remove: chapter_id});
  });

  $('#chapter-assign').on('click', function() {
    var chapter_id = $('#note-chapter').val();
    var chapter = $('#note-chapter option:selected').text();
    $('#note-form').slideUp();
    $('#note-assign span').text(chapter);
    $('#note-assign').slideDown();
    $('ul.media-list').addClass('assign');
    $('ul.media-list li').each(function(){
      if($(this).data('chapter-id') == chapter_id) $(this).addClass('active');
    });
    $('ul.media-list li').on('click', function(){
      console.log('ASSIGN');
      $(this).toggleClass('active');
    });
  });
  var cancelAssign = function() {
    $('#note-form').slideDown();
    $('#note-assign').slideUp();
    $('ul.media-list').removeClass('assign');
    $('ul.media-list li').removeClass('active');
    $('ul.media-list li').off('click');
  };
  $('#chapter-assign-cancel').on('click', cancelAssign);
  $('#chapter-assign-save').on('click', function() {
    var chapter_id = $('#note-chapter').val();
    var chapter = $('#note-chapter option:selected').text();
    var ids = [];
    $('ul.media-list li.active').each(function(){
      ids.push($(this).attr('id'));
    });
    console.log('save these:', ids, 'with chapter', chapter_id, chapter);
    SOCKET.emit('slide change', {space: SPACE, assign: { id: chapter_id, ids: ids}});
    cancelAssign();
  });
  // Note show-type
  $('#show-type,#show-chapter').on('change', function(){
    SOCKET.emit('slide change', {space: SPACE, type: $('#show-type').val(), chapter: $('#show-chapter').val()});
  });

  // Panic button
  $('.icon-panic').on('click', function(e){
    e.preventDefault();
    SOCKET.emit('space panic', SPACE, !$(this).hasClass('blink'));
    $(this).addClass('blink');
  })

  // Keypress CTRL-Enter sends form
  $('#note-text').keypress(function(e){
    // console.log('keypress', e);
    if(e.ctrlKey && (e.which === 10 || e.which === 13 )) {
      $('#note form').submit();
    }
  });

});
