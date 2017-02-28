// Do not auto reload
AUTORELOAD=false;
INITIALIZED=false;
FULLSCREEN=false;

/* SOCKET ACTIONS */

function initModel (obj) {
  var model = 'group';
  if(obj.step !== undefined) model = 'step';

  if(model === 'step') {
    // Select current group in select
    $('#step-changer li[data-step="' + obj.step + '"] .select-group').val(obj.group ? obj.group : '');
  }

  $('li[data-' + model + '="' + obj[model] + '"] .select-users').html('');
  if(obj.users && obj.users.length) {
    $.getJSON('/api/users',{id:obj.users}, function(users){
      // delete AJAXS[model];
      console.log('set users for ',model,obj.users,users);
      _.each(users,function(u){
        $('li[data-' + model + '="' + obj[model] + '"] .select-users').append('<option value="' + u.id + '" selected>' + u.name + '</option>');
      });
    });

  }
  // Put current values on place
  _.each(obj, function(val, key){
    if(key != 'step' && key != 'group' && key != 'users')
      $('li[data-' + model + '="' + obj[model] + '"] [data-target="' + key + '"]').attr('title', val);
  });

  // If panic, show icon
  if(obj.panic) {
    $('#step-changer li[data-step="' + obj.step + '"] .icon-panic').addClass('blink').removeClass('hidden');
  } else {
    $('#step-changer li[data-step="' + obj.step + '"] .icon-panic').removeClass('blink').addClass('hidden');
  }
}


// Update local select if anoother admin is making changes
SOCKET.on('step init', function(step) {
  initModel(step);
  $('body').loading('stop');
  INITIALIZED=true;
});

SOCKET.on('group init', function(group) {
  initModel(group);
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
      $('li[data-step=' + step+ '] .select-group').change();
      msg += ' <span class="badge">Synchronizing ' + url+'</span>';
    }
  }
  $("#feed").prepend('<p' + (error ? ' class="' + error + '"' : '') + '>' + msg + '</p>');
});

SOCKET.on('failure', function(msg) {
  $.notifyClose();
  showError(msg);
});

SOCKET.on('success', function(msg) {
  showSuccess(msg);
});
/* JQUERY ACTIONS */

$(function(){
  // Set loading initial status
  // $('body').loading({message: '<span class="glyphicon glyphicon-refresh spinning"></span> Loading...'});
  if(!INITIALIZED) $('body').loading();

  // Save property to step
  $('.property').on('click', function() {
    var step = $(this).closest('li[data-step]') ? $(this).closest('li').data('step') : null;
    var group = $(this).closest('li').data('group');
    var target = $(this).data('target');
    eModal
      .prompt({message: $(this).text(), title: $(this).attr('alt'), value: $(this).attr('title')})
      .then(function(msg){
        var obj = {};
        if(!_.isNull(step)) obj.step = step;
        if(group) obj.group = group;
        obj[target] = msg;
        if(group) {
          console.log('EMIT GROUP',obj);
          SOCKET.emit('group change', obj)
        } else {
          console.log('EMIT STEP',obj);
          SOCKET.emit('step change', obj)
        }
        // initModel(obj);
        showSuccess('Set <strong>'+target+'</strong> to <em>'+msg+'</em>');
      }, function(){
        showWarning('Nothing done');
      });
  });

  $('.select-group').on('change', function(){
    var step = $(this).closest('li').data('step');
    var group = $(this).val();
    console.log('emit step change', step, group);
    SOCKET.emit('step change', {step: step, group: group});
    //- $("#feed").prepend('<p><span class="badge">Synchronizing Step ' + step + ', Group ' + group + '</span></p>');
  });

  $('#rotate').on('click', function(){
    var total = $('.select-group').length;
    $('.select-group').each(function(index){
      var $li = $(this).closest('li');
      var first = parseInt($('.select-group option:first').val(), 10);
      var last = parseInt($('.select-group option:last').val(), 10);
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
    $('.select-group').change();
  });


  $('#reset').on('click', function() {
    $('.select-group').each(function(index){
      var step = parseInt($(this).closest('li').data('step'), 10);
      $(this).val(step);
      $(this).change();
    });
  });

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
  $('#step-changer .select-users')
    .select2(select2)
    .on('change', function(item) {
      var values = $(item.target).val() || [];
      var step = $(this).closest('li').data('step');
      console.log('save users for Step', step, values);
      SOCKET.emit('step change', {step: step, users: values});
    });
  $('#group-changer .select-users')
    .select2(select2)
    .on('change', function(item) {
      var values = $(item.target).val() || [];
      var group = $(this).closest('li').data('group');
      console.log('save users for Group', group, values);
      SOCKET.emit('group change', {group: group, users: values});
    });
});

