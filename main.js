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
        default: alert("unimplemented feature: " + item);
    }
}

function menuMove() {
    window.move = true;
    window.amplify = false;
    getContext('selectcanvas').clearRect(0, 0, 800, 600);
}

function menuSearch() {
    $("#search").toggle();
}

function menuAmplify() {
    window.amplify = true;
    window.move = false;
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
    num = heights.length
    heights[num] = getJson(req.responseText);
    moveheights = heights.slice(0);
    possible_colors = ["#FF0000", "#00FF00", "#0FF000", "#000FF0", "#F0000F"];
    color_choice = Math.floor(Math.random()*len(possible_colors))
    colors[num] = '#' + possible_colors[color_choice];
    document.getElementById("searchbox").value = '';
    $("#search").toggle();
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
    $("#searchtablediv").toggle();
}

function getJson(id) {
    var oRequest = new XMLHttpRequest();
    var sURL = '../peaks/' + id + '.txt';
    var numSongs = heights.length;
    oRequest.open("GET", sURL, false);
    oRequest.send(null);
    h = new Array();
    Player['video'][Player['video'].length] = {
        'id': id
    };
    debug(Player);
    if (oRequest.status == 200) {
        peaks = oRequest.responseText;
        peaks = eval(peaks);
        for (x = 0; x < peaks.length - 2; x += 3) {
            h[x / 3] = (peaks[x] + peaks[x + 1] + peaks[x + 2]) / 3 * 200
        }
        return h
    } else {
        alert("Error executing XMLHttpRequest call!");
    }
}
amplify = false;
move = false;


dragtarget = null;

function getHeight(myheights, songnum, x) {
    var h = 0;
    if (songnum < 0) {
        return 0;
    }
    for (var song = 0; song <= songnum; song += 1) {
        if (isNaN(myheights[song][x]) == false)
            h += myheights[song][x]
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
        for (var song = 0; song < heights.length; song += 1) {
            if (dragStartY < getHeight(heights, song, dragStartX) || amplify ==
                true) {
                if (amplify == false) {
                    selectSong = song;
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
    }
}

function drawContext(h) {
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, 800, 600);
    for (var song = 0; song < heights.length; song += 1) {
        for (x = 0; x <= 800; x += 1) {
            context.strokeStyle = colors[song]
            context.beginPath();
            context.moveTo(x, getHeight(h, song - 1, x));
            context.lineTo(x, getHeight(h, song, x));
            context.closePath();
            context.stroke();
        }
    }
}

function drawSelect(song, left, right, h) {
    var selectcanvas = document.getElementById('selectcanvas');
    var selectcontext = selectcanvas.getContext('2d');
    selectcontext.clearRect(0, 0, 800, 600);
    for (var x = left; x <= right; x += 1) {
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

function OnMouseUp(e) {
    if (dragtarget != null) {
        document.onmousemove = null;
        document.onselectstart = null;
        dragtarget.ondragstart = null;
        dragStopX = e.clientX - 120;
        dragStopY = e.clientY - 0;
        dragtarget = null;
        if (amplify == true) {
            heights[selectSong] = moveheights[selectSong].slice(0);
            amplify = false;
        }
        if (move == true) {
            dx = dragStopX - dragStartX;
            adx = Math.abs(dx);
            heights[selectSong] = moveheights[selectSong].slice(0);
            move = false;
        }
        if (amplify == false && move == false) {
            selectStart = Math.min(dragStartX, dragStopX);
            selectStop = Math.max(dragStartX, dragStopX);
        } else {
            selectStart = 0;
            selectStop = 0;
            drawSelect(0, 0, 0, heights);
        }
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
    starty = Math.min(currentY, dragStartY);
    endy = Math.max(currentY, dragStartY);
    dy = endy - starty;
    dx = endx - startx;
    if (amplify == true) {
        moveheights[selectSong] = heights[selectSong].slice(0);
        for (x = selectStart; x < selectStop; x += 1) {
            moveheights[selectSong][x] = Math.max(0, heights[selectSong][x] +
                currentY - dragStartY);
        }
        drawSelect(selectSong, selectStart, selectStop, moveheights);
        drawContext(moveheights)
    }
    if (move == true) {
        moveheights[selectSong] = heights[selectSong].slice(0);
        dx = currentX - dragStartX;
        adx = Math.abs(dx);
        if (dx < 0) {
            for (x = 800; x >= currentX; x -= 1) {
                if (isNaN(heights[selectSong][x - currentX + dragStartX])) {
                    moveheights[selectSong][x] = 0
                } else {
                    moveheights[selectSong][x] = Math.max(heights[selectSong][x -
                        currentX + dragStartX
                    ], 0);
                }
            }
            drawSelect(selectSong, currentX, 800, moveheights);
        }
        if (dx > 0) {
            for (x = 0; x <= currentX; x += 1) {
                if (isNaN(heights[selectSong][x - currentX + dragStartX])) {
                    moveheights[selectSong][x] = 0
                } else {
                    moveheights[selectSong][x] = Math.max(heights[selectSong][x -
                        currentX + dragStartX
                    ]);
                }
            }
            drawSelect(selectSong, 0, currentX, moveheights);
        }
        drawContext(moveheights);
    }
    if (move == false && amplify == false) { //selection
        drawSelect(selectSong, startx, endx, heights);
    }
}

function ready() {

    //GET BROWSER WINDOW HEIGHT
    var currHeight = $(window).height();
    //SET HEIGHT OF SIDEBAR AND CONTENT ELEMENTS
    $('#menu, #page').css('height', currHeight);

    //ON RESIZE OF WINDOW
    $(window).resize(function() {

        //GET NEW HEIGHT
        var currHeight = $(window).height();
        //RESIZE BOTH ELEMENTS TO NEW HEIGHT
        $('#menu, #page').css('height', currHeight);

    });
    Player = new Object();
    Player['video'] = new Array();
    heights = new Array();
    document.onmousedown = OnMouseDown;
    document.onmouseup = OnMouseUp;
    colors = new Array();
    actions = new Array();
    amplify = false;
    move = false;
    moveheights = heights.slice(0);
    drawContext(heights);
    debug('DUT5rEU6pqM');
    debug('4W8EwuMOi8I');
    debug('obV-OL3TwXo');
}
