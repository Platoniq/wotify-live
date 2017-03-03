FULLSCREEN=false;

/* SOCKET ACTIONS */

function addSlides(slides) {
  var valid = [];
  var totals = {api:0,note:0};
  _.each(slides, function(slide) {
    var markup = '<li class="media" id="' + slide.id + '">' +
      '<div class="media-left">' +
        '<a href="#">' +  getHexagon(slide) + '</a>' +
      '</div>' +
      '<div class="media-body">' +
        '<h4 class="media-heading"><b class="userId">' + slide.userId + '</b> <span class="author">' + slide.author + '</span>' +
        '<span class="pull-right">' +
        (slide.group ? '<span class="badge">Group ' + slide.group + '</span>&nbsp;' : '') +
        (slide.type === 'note' ? '<span class="btn-group"><button title="Edit note" class="note-edit btn btn-info"><span class="glyphicon glyphicon-edit"></span></button><button title="Remove note" class="note-remove btn btn-danger"><span class="glyphicon glyphicon-trash"></span></button></span>' : '<button title="Copy note" class="btn btn-success note-copy"><span class="glyphicon glyphicon-copy"></span></button>' ) +
        '</span>' +
        '</h4>' +
        '<div class="text">' + slide.text + '</div>' +
        '<div class="date">' +  (new Date(slide.created_at)).toLocaleString() + '</div>' +
      '</div>' +
    '</li>';
    if($('#' + slide.type + ' #' + slide.id).is('li')) {
      $('#' + slide.type + ' #' + slide.id).replaceWith(markup);
    } else {
      $('#' + slide.type + ' ul.media-list').prepend(markup);
    }
    totals[slide.type] = (totals[slide.type] || 0) + 1;
    valid.push(slide.id);
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
        $('#' + model + '-users > h4').html('Idea Feeders & Facilitators');
      _.each(users,function(u){
        if(model=="group")
          $('#' + model + '-users .users').append('<div class="pull-left">'+getHexagon(u,1)+'</div>');
        else
          $('#' + model + '-users .users').append('<div class="pull-left">'+getHexagon(u,1)+'</div>');
      });
    });
  }

}

SOCKET.on('slides step ' + STEP, function(slide) {
  $('body').loading('stop');
  if(slide && slide.show) {
    $('#show-type').val(slide.show);
  }
  var slides = slide && slide.slides;
  $('.spinning').hide();
  // console.log('Adding slides', slides);
  addSlides(slides || []);
});

SOCKET.on('step init', function(step) {
  if(STEP === step.step) {
    GROUP=step.group;
    console.log('Received init event for step ',step.step,'Current Step', STEP);
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

$(function(){
  // Set loading initial status

  console.log('Asking for slides');
  $('body').loading();
  SOCKET.emit('get slides', STEP, true);


  var select2 = {
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

  $('#note-user').select2(select2);

  // Live/dynamic event handler
  $('ul.media-list').on('click', '.note-edit', function(e){
    e.preventDefault();
    $(this).closest('li').addClass('editing');
    var id = $(this).closest('li').attr('id');
    var userId = $(this).closest('li').find('.userId').text();
    var author = $(this).closest('li').find('.author').text();
    var text = $(this).closest('li').find('.text').text();
    // console.log('EDIT', id, userId, author, text);
    $('#note-user').html('').append('<option value="' + userId + '" selected>' + author + '</option>');
    $('#note-id').val(id);
    $('#note-text').val(text).focus();
  });

  $('ul.media-list').on('click', '.note-remove', function(e){
    e.preventDefault();
    var id = $(this).closest('li').attr('id');

    SOCKET.emit('slide remove', {step:STEP,id:id});
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
      step: STEP,
      add: {
        userId: $('#note-user').val(),
        text: $('#note-text').val(),
        id: $('#note-id').val(),
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

  // Note show-type
  $('#show-type').on('change', function(){
    SOCKET.emit('slide change', {step: STEP, show: $(this).val()});
  });

  // Panic button
  $('.icon-panic').on('click', function(e){
    e.preventDefault();
    SOCKET.emit('step panic', STEP, !$(this).hasClass('blink'));
    $(this).addClass('blink');
  })

  // Keypress CTRL-Enter sends form
  $('body').keypress(function(e){
     if(e.ctrlKey && e.which === 13 ) {
      $('#note form').submit();
     }
  });
});
