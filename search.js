function searchHandler(e){
	if(e.which==13||e.keyCode==13){
		var contents = document.getElementById("searchbox").value;
		alert(contents);
	}
	document.getElementById("searchbox").value = 'downloading song...';

}
