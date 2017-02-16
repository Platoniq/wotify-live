
function updateSlider(){
  num=0;
  items='';
 
  _.each(PROJECTS, function(project) {
    if(project.extra && project.extra.step0 && project.extra.step0.whatif){
        whatif=project.extra.step0.whatif;
        num++;
        img_author=project.leader.picture;
        author=project.leader.name;
        items+='<div class="item';
        if(num==1)
            items+=' active';
        items+='" >';
        items+='<p class="text-center">'
        items+=whatif;  
        items+='</p>';
        items+='<div class="text-center">'
        items+='<img style="border-radius: 50%;" width="75" src="'+img_author+'" >';  
        items+=' <span style="font-size:16px">'+author+'<span>'
        items+='</div>'  
        items+='</div>';  
    }        
  });

  $('div#items').html(items); 
}

$(function(){
  updateSlider();

  setTimeout(function(){ 
    updateSlider(); 
  }, 1000);

  $('.carousel').carousel({
    interval: 1000 * 6
  });

});