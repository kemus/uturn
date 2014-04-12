function searchHandler(e){
	if(e.which==13||e.keyCode==13){
		var contents = document.getElementById("searchbox").value;
		stage='0'
        	xml_http_post("index.html", stage+contents, search_handle)
		document.getElementById("searchbox").value = 'downloading song...';
	}

}

function search_handle(req) {
    var contents = document.getElementById("searchitem").value;
    debug(req.responseText);
}
