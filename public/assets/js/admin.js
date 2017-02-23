// Do not auto reload
AUTORELOAD=false;
INITIALIZED=false;

/* SOCKET ACTIONS */

function initStep (step) {
  console.log($('li[data-step="' + step.step + '"] [data-target="title"]').attr('alt'), step);
  if(step.step && step.group) {
    // Select current step in select
    $('#step-changer li[data-step=' + step.step + '] .select-step').val(step.group);
  }
  if(step.users && step.users.length) {
    $.getJSON('/api/users',{id:step.users},function(users){
      console.log('set users',step.users,users);
      $('li[data-step="' + step.step + '"] .select-users').html('');
      _.each(users,function(u){
        console.log(u.name);
        $('li[data-step="' + step.step + '"] .select-users').append('<option value="' + u.id + '" selected>' + u.name + '</option>');
      });
    });

  }
  // Put current values on place
  _.each(step, function(val, key){
    if(key != 'step' && key != 'group' && key != 'users')
      $('li[data-step="' + step.step + '"] [data-target="' + key + '"]').attr('title', val);
  });

}


// Update local select if anoother admin is making changes
SOCKET.on('step init', function(step) {
  initStep(step);
  $('body').loading('stop');
  INITIALIZED=true;
});

$('#reload-remotes').on('click', function(){
  console.log('Reloading remotes');
  SOCKET.emit('reload remotes');
});

SOCKET.on('refresh feed',function(msg, error, url){
  if(url) {
    // Check for connections to steps (and send current status)
    url = url.substr(url.lastIndexOf('/') + 1);
    if(url.indexOf('step') === 0) {
      // Send current status
      var step = parseInt(url.substr(4),10);
      $('li[data-step=' + step+ '] .select-step').change();
      msg += ' <span class="badge">Synchronizing ' + url+'</span>';
    }
  }
  $("#feed").prepend('<p' + (error ? ' class="error"' : '') + '>' + msg + '</p>');
});

SOCKET.on('error', function(msg) {
  $.notifyClose();
  showError(msg);
});
/* JQUERY ACTIONS */

$(function(){
  // Set loading initial status
  // $('body').loading({message: '<span class="glyphicon glyphicon-refresh spinning"></span> Loading...'});
  if(!INITIALIZED) $('body').loading();

  // Save property to step
  $('.property').on('click', function() {
    var step = $(this).closest('li').data('step');
    var target = $(this).data('target');
    eModal
      .prompt({message: $(this).text(), title: $(this).attr('alt'), value: $(this).attr('title')})
      .then(function(msg){
        var obj = {step: step};
        obj[target] = msg;
        SOCKET.emit('step change', obj)
        // initStep(obj);
        showMsg('Set <strong>'+target+'</strong> to <em>'+msg+'</em>');
      }, function(){
        showWarning('Nothing done');
      });
  });

  $('.select-step').on('change', function(){
    var step = $(this).closest('li').data('step');
    var group = $(this).val();
    console.log('emit step change', step, group);
    SOCKET.emit('step change', {step: step, group: group});
    //- $("#feed").prepend('<p><span class="badge">Synchronizing Step ' + step + ', Group ' + group + '</span></p>');
  });

  $('#rotate').on('click', function(){
    var total = $('.select-step').length;
    $('.select-step').each(function(index){
      var $li = $(this).closest('li');
      var first = parseInt($('.select-step option:first').val(), 10);
      var last = parseInt($('.select-step option:last').val(), 10);
      var g = parseInt($(this).val()) + 1;
      if(g > last) {
        g = first;
      }

      $(this).val(g);
      $(this).change();

      console.log('step ', $li.data('step'), 'group', g, last);
    });
  });

  $('#sync').on('click', function() {
    $('.select-step').change();
  });


  $('#reset').on('click', function() {
    $('.select-step').each(function(index){
      var step = parseInt($(this).closest('li').data('step'), 10);
      $(this).val(step);
      $(this).change();
    });
  });

  $('.select-users').select2({
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
    escapeMarkup: function (markup) { return markup; },
    minimumInputLength: 1,
    templateSelection: function(item) {
      return '<b>' + item.id + '</b> ' + (item.name || item.text);
    },
    templateResult: function(item) {
      if (item.loading) return item.name;
      var markup = "<div class='select2-result-repository clearfix'>" +
        "<div class='select2-result-repository__avatar'><img src='" + item.avatar + "' /></div>" +
        "<div class='select2-result-repository__meta'>" +
        "<div class='select2-result-repository__title'><b>" + item.id + '</b> ' + item.name + "</div>";

      // if (repo.bio) {
      //   markup += "<div class='select2-result-__description'>" + repo.bio + "</div>";
      // }

      markup += "</div></div>";

      return markup;
    },
  }).on('change', function(item) {
    var values = $(item.target).val() || [];
    var step = $(this).closest('li').data('step');
    console.log('save users for', step, values);
    SOCKET.emit('step change', {step: step, users: values});
  });
});

