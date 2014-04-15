function searchHandler(e){
    if(e.which==13||e.keyCode==13){
        var contents = document.getElementById("searchbox").value;
        stage='0';
            xml_http_post("index.html", stage+contents, search_handle)
    }

}

function search_handle(req) {

    results = eval(req.responseText);

    var table = document.getElementById("searchtable");
    for(var i=0;i < results.length; i+=1) {
        row=table.insertRow(-1);
        left = row.insertCell(0);
        right= row.insertCell(1);
        link = 'javascript:searched(\''+results[i]['id']+'\');';
        left.innerHTML = '<a href="'+link+'"><img style="width:100px; height:100px;" src="'+results[i]['img']+'"/></a>';

        right.innerHTML = '<a href="'+link+'">'+results[i]['title']+'</a>';
    }
    //$("#searchtablediv").toggle();
}
