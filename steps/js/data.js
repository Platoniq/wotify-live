function getUrlParameter(sParam) {
  var sPageURL = decodeURIComponent(window.location.search.substring(1)),
      sURLVariables = sPageURL.split('&'),
      sParameterName,
      i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : sParameterName[1];
    }
  }
};

var step=getUrlParameter('step');

var only_datatakers=getUrlParameter('datatakers');

var url="https://roadbook.ideacamp2017.eu/api/v2/projects";

var PROJECTS;

setTimeout(function(){ 
   $.getJSON(url, function(data) {
	if(only_datatakers){
	    PROJECTS=_.where(data, function(project) 
		    { 
		    	return project && project.leader && project.leader.rol == "superadmin"; 
		    }  
	    );
	}
	else
		PROJECTS=data;
	});  
}, 1000);

    