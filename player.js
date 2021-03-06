function play(num, id)
{
    getFlashObject(num).SetVariable("method:setUrl", "/mp3/"+id+".mp3 ");

    getFlashObject(num).SetVariable("method:play", "");
    getFlashObject(num).SetVariable("enabled", "true");
}
function playbutton(){
    img = document.getElementById("playIcon") ;
        img.src = (img.src.indexOf("stop") != -1)? "images/play.png" : "images/stop.png";
        (img.src.indexOf("play") != -1)? Player.stop() : Player.play();
    return false;
}
Player.play = function (){
    for (i=0; i< window.videoids.length; i+=1){
        playVideo(i);
    }
}


Player.stop = function (){
    for (i=0; i< window.videoids.length; i+=1){
        pause(i);
    }
}
function acquirePlayer(video){
    for(i = 0; i<window.videoids.length; i+=1){
        if (window.videoids[i] == video['id']){
            return i;
        }
    }
}

function stopVideo(video){
    i= acquirePlayer(video);
    pause(i);
    debug("paused: " + player);
    Player.timeouts.forEach(function (tid) {window.clearTimeout(tid);});
    Player.timeouts = [] ;
}

tau = 3;
function normalizeVolume(commands){
    var volumes = []
    commands.forEach(function(command){if (command.type == 'volume') {
        volumes =volumes.concat(command.amount);}} );
    var val = 0;
    var max = 0;
    for(var i = 0 ; i < heights.length ; i++ ) {
    for(var j = 0 ; j < heights[i].length ; j++ ) {
            val = heights[i][j];
               if (val > max){
                max = val;
            }
    }
    }
    return commands.map(function(command) {
            if (command.type == 'volume' ) {
                command.amount = command.amount / max;
            }
            return command
        })
}
function compile(video){
    if (video.commands){
        x = video.commands.pop();
        xs = video.commands;
        video.commands = applyCommand(x,xs);
        video.commands = normalizeVolume(video.commands);
    }

}
function applyCommand(x,xs){
    if (! x){
        return []
    }
    xz = xs.pop();
    return apply(x,applyCommand(xz,xs))
}


function apply(c,cs){
    bug = c
    out = []
    if(c.type == 'amplify'){
        out = [{type:'volume' , amount : -1*c.amount, time : c.selectStart},{ type: 'volume', amount: 1*c.amount, time : c.selectStop}].concat(cs)
    }
    if(c.type == 'stop'){
        out = [c].concat(cs)
    }
    if(c.type == 'start'){
        out = [c].concat(cs)
    }
    if(c.type == 'move'){
        var i = 0
        var toAdd = [] ;
    var toRemove = []
        while ( i < cs.length ) {
            if (c.selectStart+c.amount <= cs[i].time && cs[i].time <= c.selectStop + c.amount){
                if(cs[i].type == 'amplify'){
                    //toAdd = toAdd.concat([{type:'volume' , amount : -1*cs[i].amount, time : c.selectStop+amount}]);
                    //toAdd = toAdd.concat([{type:'volume' , amount : cs[i].amount, time : c.selectStart+amount}]);
                    cs[i].time += c.amount;
                }if(cs[i].type == 'start' || cs[i].type == 'stop'){
            cs= cs.splice(i,1);
            i--;
                    //toAdd = toAdd.concat([{type:'volume' , amount : -1*cs[i].amount, time : c.selectStop+amount}]);
                    //toAdd = toAdd.concat([{type:'volume' , amount : cs[i].amount, time : c.selectStart+amount}]);
                }
            }
            i++;
        }
        cs = cs.concat(toAdd)
        out = [{type:"stop", time: c.selectStart},{ type:"start", time : c.selectStop, from: c.selectStop},{type:"start" ,time:c.selectStart + c.amount , from:c.selectStart}, { type : "stop" , time: c.selectStop + c.amount}].concat(cs)

    }

    return out.sort(function(a,b){return a.time-b.time})
}

function interpretActions(){
    var end = actions.length
    var i = 0;
    commands = []
    for( var i = 0 ; i < Player['video'].length ; i++ ){
    Player['video'][i].commands = [{type: 'start', time:0, from:0},{type: 'stop' , time:  Math.ceil(heights[i].length)}];

    }
    i = 0;
    while (i<end){
    action = actions[i];
    Player['video'][action.selectSong].commands.push(action);
    i++;
    }
    Player['video'].forEach(compile)
}
function playVideo(player){
    setPosition(player, 0);
    setVolume(player,50);
    if (Player.timeouts == undefined){
    Player.timeouts = [];
    }
    Player.timemouts = Player.timeouts.concat(Player.video[player].commands.map(function (command) {
        if(command.type == "volume"){
            return setTimeout(function(){setVolume(player, 50 + 50*command.amount)}, command.time*1000/tau);
            }
        if(command.type == "start"){
                setTimeout(function(){
                t = command.from/tau;
                play(player, Player.video[player].id);
                setPlayTick(Math.floor(command.time));
                function f() {setPlayTick(window.playticks + 1)}
                interval = setInterval(f,500);
               return  setTimeout(function(){setPosition(player, command.from*1000/tau)}, 100);
                },command.time*1000/tau);
        }

        if(command.type == "stop"){
                return setTimeout(function(){
                setPosition(player, command.time*1000/tau);
                pause(player);
                },command.time*1000/tau);
                window.clearInterval(interval);
        }}
         ));
    debug("played: " + player);
}


function playbutton(){
    interpretActions();
    img = document.getElementById("playIcon") ;
        img.src = (img.src.indexOf("stop") != -1)? "images/play.png" : "images/stop.png";
        (img.src.indexOf("play") != -1)? Player.stop() : Player.play();
    window.clearInterval(interval);
    return false;
}

var myListener = new Object();

/**
* Initialisation
*/
myListener.onInit = function()
{
    this.position = 0;
};

myListener.onUpdate = function()
{
};
function getFlashObject(num)
{
    return document.getElementById("fplayer"+num);
}

function pause(num)
{
    getFlashObject(num).SetVariable("method:pause", "");
}
function stop(num)
{
    getFlashObject(num).SetVariable("method:stop", "");
}
function setPosition(num, pos)
{
    getFlashObject(num).SetVariable("method:setPosition", pos);
}
function setVolume(num, vol)
{
    bug=vol
    getFlashObject(num).SetVariable("method:setVolume", vol);
}
/*
<object class="playerpreview" id="myFlash" type="application/x-shockwave-flash" data="/medias/player_mp3_js.swf" width="1" height="1">
                <param name="movie" value="/medias/player_mp3_js.swf">
                <param name="AllowScriptAccess" value="always">
                <param name="FlashVars" value="listener=myListener&amp;interval=500">
            </object>
 */
