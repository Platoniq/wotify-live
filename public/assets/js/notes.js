FULLSCREEN=false;

/* SOCKET ACTIONS */

function addSlides(slides) {
  var valid = [];
  var totals = {api:0,note:0};
  _.each(slides, function(slide) {
    var markup = '<li class="media" id="' + slide.id + '">' +
      '<div class="media-left">' +
        '<a href="#"><img class="media-object" src="' + slide.avatar + '" alt="' + slide.author + '"></a>' +
      '</div>' +
      '<div class="media-body">' +
        '<h4 class="media-heading"><b class="userId">' + slide.userId + '</b> <span class="author">' + slide.author + '</span>' +
        (slide.type === 'note' ? '<span class="btn-group pull-right"><button title="Edit note" class="note-edit btn btn-info"><span class="glyphicon glyphicon-edit"></span></button><button title="Remove note" class="note-remove btn btn-danger"><span class="glyphicon glyphicon-trash"></span></button></span>' : '<button title="Copy note" class="btn btn-success pull-right note-copy"><span class="glyphicon glyphicon-copy"></span></button>' ) +
        '</h4>' +
        '<div class="text">' + slide.text + '</div>' +
      '</div>' +
    '</li>';
    if($('#' + slide.type + ' #' + slide.id).is('li')) {
      $('#' + slide.type + ' #' + slide.id).replaceWith(markup);
    } else {
      $('#' + slide.type + ' ul.media-list').append(markup);
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
    console.log('SET TOTAL #total-'+key,':',val);
    $('#total-' + key).text(val);
  });
}

SOCKET.on('slides step ' + STEP, function(slide) {
  $('body').loading('stop');
  if(slide && slide.show) {
    $('#show-type').val(slide.show);
  }
  var slides = slide && slide.slides;
  $('.spinning').hide();
  console.log('Adding slides', slides);
  addSlides(slides || []);
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
    console.log('Send form', obj);
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

});
