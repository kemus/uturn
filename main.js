/////////////////////////////////////////////////////////
// Global variables and helper functions

var peaks;

function debug(string) {
    $('#debug').prepend(JSON.stringify(string) + "<br/>")
}

$(document).ready(ready());

/////////////////////////////////////////////////////////
// Menu button clicks

function menu(item) {
    switch(item){
        case 'search': return menuSearch();
        case 'amplify': return menuAmplify();
        case 'move': return menuMove();
        case 'undo': return undo();
        case 'redo': return redo();
        default: alert("unimplemented feature: " + item);
    }
}

function changestate(s){
    window.state=s;
    if (window.state == 'amplify'){
        document.getElementById('moveb').style.color=null;
        document.getElementById('amplifyb').style.color="#888";
        document.getElementById('searchb').style.color=null;
    }
    else {
        if (window.state == 'move'){
            document.getElementById('moveb').style.color="#888";
            document.getElementById('amplifyb').style.color=null;
        document.getElementById('searchb').style.color=null;
        }
        else{
            if (window.state == 'search'){
            document.getElementById('moveb').style.color=null;
            document.getElementById('amplifyb').style.color=null;
        document.getElementById('searchb').style.color="#888";
        }
        else{
            document.getElementById('moveb').style.color=null;
            document.getElementById('amplifyb').style.color=null;
        document.getElementById('searchb').style.color=null;
        }
    }
    }
}

function menuMove() {
    if (window.state != "move"){
        changestate('move');
    }
    else {
        changestate('select');
    }
}
function closeSearch() {
    $("#search").hide();
    changestate('select');
}
function menuSearch() {
    if(window.state=='search'){
        changestate('select');
        $("#search").hide();
    }
    else{
        changestate('search');
        $("#search").show();
    }
}

function menuAmplify() {
    if (window.state!="amplify") {
        changestate('amplify');
    }
    else{
        changestate('select');
    }
}

////////////////////////////////////////////////////////
// Canvas modification
function getContext(id){
    return document.getElementById(id).getContext('2d');
}


////////////////////////////////////////////////////////
// AJAX

function xml_http_post(url, data, callback) {
    var req = false;
    try { // Firefox, Opera 8.0+, Safari
        req = new XMLHttpRequest();
    }
    catch (e) {
        try { // Internet Explorer
            req = new ActiveXObject("Msxml2.XMLHTTP");
        }
        catch (e) {
            try { // More Internet Explorer
                req = new ActiveXObject("Microsoft.XMLHTTP");
            }
            catch (e) { // Oops
                alert("Your browser does not support AJAX!");
                return false;
            }
        }
    }
    req.open("POST", url, true);
    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            callback(req);
        }
    }
    req.send(data);
}

possible_colors = ["#53FFF0", "#84E84B", "#FFD860", "#E8613D", "#DD63FF", "#FF7A11", "#E8159C", "#7874FF", "#40E8D4", "#75FF13"]
function test_handle(req) {
    var contents = document.getElementById("searchitem").value;
    var stage;
    switch (req.responseText){
        case '1':
            document.getElementById("searchbox").value = 'downloading song...';
            xml_http_post("index.html", '2' + contents, test_handle);
            return;
        case '2':
            document.getElementById("searchbox").value = 'converting song...';
            xml_http_post("index.html", '3' + contents, test_handle);
            return;
        case '3':
            document.getElementById("searchbox").value = 'retreiving waveform...';
            xml_http_post("index.html", '4' + contents, test_handle);
            return;
    }
    // if we got the waveform...
    num = window.heights.length
    window.heights[num] = getJson(req.responseText);
    original_heights[num] = window.heights[num].slice(0)
    moveheights = window.heights.slice(0);
    color_choice = Math.floor(Math.random()*possible_colors.length)
    colors[num] = possible_colors[num];
    document.getElementById("searchbox").value = '';
    $("#search").hide();
    changestate('select');
    drawContext(heights);
}
//////////////////////////////////////////////////////////////

function searched(id) {
    document.getElementById("searchitem").value = id;
    stage = '1'
    xml_http_post("index.html", stage + id, test_handle)
    document.getElementById("searchbox").value = 'downloading song...';
    //
    var table = document.getElementById("searchtable");
    for (var i = table.rows.length-1; i>=0; i--){
        table.deleteRow(i)
    }
    $("#searchtablediv").hide();
}

function getJson(id) {
    var oRequest = new XMLHttpRequest();
    var sURL = '../peaks/' + id + '.txt';
    var numSongs = window.heights.length;
    Player['video'][Player['video'].length] = {
        'id': id
    };
    oRequest.open("GET", sURL, false);
    oRequest.send(null);

    window.videoids[numSongs] = id;
    h = new Array();
    if (oRequest.status == 200) {
        peaks = oRequest.responseText;
        peaks = eval(peaks);
        for (x = 0; x < peaks.length - 1; x += 2) {
            h[x/2] = (peaks[x] + peaks[x+1])/2 * 300
        }
        return h
    } else {
        alert("Error executing XMLHttpRequest call!");
    }
}

state="search";
dragtarget = null;

function getHeight(myheights, songnum, x) {
    var h = 0;
    if (songnum < 0) {
        return 0;
    }
    for (var song = 0; song <= songnum; song += 1) {
        if (isNaN(myheights[song][x]) == false)
            h += Math.max(myheights[song][x],0);
    }
    return h
}

function OnMouseDown(e) {
    var selectcanvas = document.getElementById('selectcanvas');
    target = e.target;
    loffset = 120;
    if (target.className.indexOf('canvas') !== -1) {
        dragStartX = e.clientX - loffset;
        dragStartY = e.clientY - 0;
        if (window.state == "select") {
            for (var song = 0; song < window.heights.length; song += 1) {
                if (dragStartY < getHeight(heights, song, dragStartX)) {
                    selectSong = song;
                    break;
                }
            }
        }
        document.onmousemove = OnMouseMove;
        document.body.focus();
        document.onselectstart = function () {
            return false;
        };
        target.ondragstart = function () {
            return false;
        };
        dragtarget = target;
        return false;
    }
}
//////////////////// `
function drawContext(h) {
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, window.width, window.height);
    for (var song = 0; song < window.heights.length; song += 1) {
        for (x = 0; x <= window.width; x += 1) {
            context.strokeStyle = colors[song]
            context.beginPath();
            context.moveTo(x, getHeight(h, song - 1, x));
            context.lineTo(x, getHeight(h, song, x));
            context.closePath();
            context.stroke();
        }
    }
    drawPlay(h);
}
function drawSelect(song, left, right, h) {
    var selectcanvas = document.getElementById('selectcanvas');
    var selectcontext = selectcanvas.getContext('2d');
    selectcontext.clearRect(0, 0, window.width, window.height);
    for (var x = left; x < right; x += 1) {
        if (h[song][x] > 0) {
            selectcontext.strokeStyle = '#0000FF';
            selectcontext.beginPath();
            selectcontext.moveTo(x, getHeight(h, song - 1, x));
            selectcontext.lineTo(x, Math.max(getHeight(h, song, x), getHeight(h,
                song - 1, x)));
            selectcontext.closePath();
            selectcontext.stroke();
        }
    }
}
function drawPlay(h) {
    var playcanvas = document.getElementById('playcanvas');
    var playcontext = playcanvas.getContext('2d');

    playcontext.clearRect(0, 0, window.width, window.height);
    for(var x = 0; x < window.width; x += 90) {
        playcontext.strokeStyle = '#999999';
        playcontext.beginPath();
        playcontext.moveTo(x, 0);
        playcontext.lineTo(x, getHeight(h, h.length-1, x));
        playcontext.closePath();
        playcontext.stroke();
    }
    playcontext.strokeStyle = '#000000';
    playcontext.beginPath();
    playcontext.moveTo(window.playticks,0);
    playcontext.lineTo(window.playticks,getHeight(h, h.length-1, window.playticks));
    playcontext.closePath();
    playcontext.stroke();
}

function applyAction(action, songheights){
    newheights = songheights.slice(0);
    if (action['type'] == 'amplify'){
        for (x = action['selectStart']; x <= action['selectStop']; x += 1) {
            newheights[x] -= action['amount'];
        }
    }
    if (action['type'] =='move'){
        for (x = action['selectStart']; x <= action['selectStop']; x += 1) {
                newheights[x]=-1000;
        }
        for (x = action['selectStart']+action['amount']; x<= action['selectStop']+action['amount']; x++) {
            if (isNaN(songheights[x - action['amount']])) {
                newheights[x] = -1000;
            } else {
                newheights[x] = songheights[x - action['amount']];
            }
        }
        selectStart+=action['amount'];
        selectStop+=action['amount'];
    }
    return newheights.slice(0)
 }
function redo(){
    if (undoactions.length==0){
        return
    }
    actions.push(undoactions.pop());
    window.heights=original_heights.slice(0);
    for (i = 0; i<actions.length; i++){
        action = actions[i];
        selectSong = action['selectSong'];
        selectStart = action['selectStart'];
        selectStop = action['selectStop'];
        window.heights[selectSong]=applyAction(action, window.heights[selectSong])
    }
    drawSelect(selectSong, selectStart, selectStop, window.heights);
    drawContext(heights);
}
function undo(){
    if (actions.length == 0){
        return;
    }
    undoactions.push(actions.pop());
    window.heights=original_heights.slice(0);
    for (i = 0; i<actions.length; i++){
        action = actions[i];
        selectSong = action['selectSong'];
        selectStart = action['selectStart'];
        selectStop = action['selectStop'];
        window.heights[selectSong]=applyAction(action, window.heights[selectSong])
    }
    drawSelect(selectSong, selectStart, selectStop, window.heights);
    drawContext(heights);
}
function OnMouseUp(e) {
    if (dragtarget != null) {
        document.onmousemove = null;
        document.onselectstart = null;
        dragtarget.ondragstart = null;
        dragStopX = e.clientX - 120;
        dragStopY = e.clientY - 0;
        dragtarget = null;

        if (window.state == "select") {
            selectStart = Math.min(dragStartX, dragStopX);
            selectStop = Math.max(dragStartX, dragStopX);
        } else {
            dx = dragStopX - dragStartX;
            dy = dragStartY - dragStopY;
            num_actions = actions.length;
            if (window.state == "amplify") {
                actions[num_actions] = {'type':'amplify', 'selectSong':selectSong, 'selectStart':selectStart, 'selectStop':selectStop, 'amount':dy}
                undoactions = new Array();
                window.heights[selectSong] = applyAction(actions[num_actions], window.heights[selectSong])
                changestate("select");
            }
            if (window.state=="move") {
                actions[num_actions] = {'type':'move', 'selectSong':selectSong, 'selectStart':selectStart, 'selectStop':selectStop, 'amount':dx}
                undoactions = new Array();
                window.heights[selectSong] = applyAction(actions[num_actions], window.heights[selectSong])
                changestate("select");
            }
        }
        if (heights.length > 0){
        while(heights[selectSong][selectStart] <= 0){
            selectStart+=1;
        }
        while(heights[selectSong][selectStop] <= 0){
            selectStop-=1;
        }
        }
        drawSelect(selectSong, selectStart, selectStop, window.heights);
        drawContext(heights);
    }
}
selectSong = 0;
selectStart = 0;
selectStop = 0;

function OnMouseMove(e) {
    if (e == null)
        var e = window.event;
    loffset = 120;
    toffset = 0;
    currentX = e.clientX - loffset;
    currentY = e.clientY - toffset;
    startx = Math.min(currentX, dragStartX);
    endx = Math.max(currentX, dragStartX);
    if (window.state=="amplify") {
        moveheights[selectSong] = window.heights[selectSong].slice(0);
        for (x = selectStart; x <= selectStop; x += 1) {
            moveheights[selectSong][x] = Math.max(0, window.heights[selectSong][x] +
                currentY - dragStartY);
        }
        drawSelect(selectSong, selectStart, selectStop, moveheights);
        drawContext(moveheights)
    }
    if (window.state=="move") {
        moveheights[selectSong] = window.heights[selectSong].slice(0);
        dx = currentX - dragStartX;
        adx = Math.abs(dx);
        selectWidth = selectStop-selectStart
        for (x = selectStart; x <= selectStop; x += 1) {
                moveheights[selectSong][x]=0;
        }
        for (x = selectStart+dx; x<= selectStop+dx; x++) {

            if (isNaN(heights[selectSong][x-dx])) {
                moveheights[selectSong][x] = 0
            } else {
                moveheights[selectSong][x] = Math.max(heights[selectSong][x - dx], 0);
            }
        }

        drawSelect(selectSong, selectStart+dx, selectStop+dx, moveheights);
        drawContext(moveheights);
    }
    if (window.state=="select") { //selection
        drawSelect(selectSong, startx, endx, window.heights);
    }
}

    function setPlayTick(s){
        window.playticks=s
        drawPlay(window.heights);
    }

function ready() {

    //GET BROWSER WINDOW HEIGHT
    window.height = $(window).height()-5;
    window.width = $(window).width()-125;
    //SET HEIGHT OF SIDEBAR AND CONTENT ELEMENTS
    $('#menu, #page').css('height', window.height);
    document.getElementById('playcanvas').height=window.height;
    document.getElementById('playcanvas').width=window.width;
    document.getElementById('selectcanvas').height=window.height;
    document.getElementById('selectcanvas').width=window.width;
    document.getElementById('canvas').height=window.height;
    document.getElementById('canvas').width=window.width;

    //ON RESIZE OF WINDOW
    $(window).resize(function() {
        //GET NEW HEIGHT
        window.height = $(window).height();
        //RESIZE BOTH ELEMENTS TO NEW HEIGHT
        $('#menu, #page').css('height', window.height);

    });
    window.videoids=new Array();
    Player = new Object();
    Player['video'] = new Array();
    window.heights = new Array();
    original_heights = new Array();
    document.onmousedown = OnMouseDown;
    document.onmouseup = OnMouseUp;
    colors = new Array();
    actions = new Array();
    undoactions = new Array();
    changestate("select");
    moveheights = window.heights.slice(0);
    drawContext(heights);
    debug('DUT5rEU6pqM');
    debug('4W8EwuMOi8I');
    debug('obV-OL3TwXo');
}
