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
}

tau = 3;
function normalizeVolume(commands){
    var volumes = []
    commands.forEach(function(command){if (command.type == 'volume') {
        volumes =volumes.concat(command.amount);}} );
    var val = 0;
    var max = 0;
    for(var i = 0 ; i< volumes.length ; i ++ ) {
        val += volumes[i];
        if (Math.abs(val)> max){
            max = Math.abs(val);
        }
    }
    max = max *2;
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
        var end = cs.length
        var i = 0
        var toAdd = [] ;
        //while ( i < end ) {
    //        if (c.selectStart< cs[i].time && cs[i].time < c.selectStop){
//                if(cs[i].type == 'amplify'){
//                    toAdd = toAdd.concat([{type:'volume' , amount : -1*cs[i].amount, time : c.selectStop+amount}]);
//                    toAdd = toAdd.concat([{type:'volume' , amount : cs[i].amount, time : c.selectStart+amount}]);
//                    cs[i].time += c.amount;
//                }
//
//            }
//
//            i++;
//        }
        cs = cs.concat(toAdd)
        bug = [{type:"stop", time: c.selectStart},{ type:"start", time : c.selectStop, from: c.selectStop},{type:"start" ,time:c.selectStart + c.amount , from:c.selectStart}, { type : "stop" , time: c.selectStop + c.amount}];
        out = [{type:"stop", time: c.selectStart},{ type:"start", time : c.selectStop, from: c.selectStop},{type:"start" ,time:c.selectStart + c.amount , from:c.selectStart}, { type : "stop" , time: c.selectStop + c.amount}].concat(cs)

    }

    return out.sort(function(a,b){return a.time-b.time})
}

function interpretActions(){
    var end = actions.length
    var i = 0;
    commands = []
    for( var i = 0 ; i < Player['video'].length ; i++ ){
    Player['video'][i].commands = [{type: 'start', time:0, from:0},{type: 'stop' , time:  heights[i].length}];

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
    Player.video[player].commands.forEach(function (command) {
        if(command.type == "volume"){
            setTimeout(function(){setVolume(player, 50 + 100*command.amount)}, command.time*1000/tau);
            }
        if(command.type == "start"){
                setTimeout(function(){
                pause(player);
                t = command.from/tau;
                play(player, Player.video[player].id);
                setPosition(player, command.from*1000/tau);
                //setPlayTick(Math.floor(getFlashObject(player).position*tau/1000));
                //function f() {setPlayTick(Math.floor(getFlashObject(player).position*tau/1000))}
                //interval = setInterval(f,100);
                },command.time*1000/tau);
                alert("play");
        }

        if(command.type == "stop"){
                setTimeout(function(){
                setPosition(player, command.time*1000/tau);
                pause(player);
                },command.time*1000/tau);
        }}
         );
    debug("played: " + player);
}


function playbutton(){
    interpretActions();
    img = document.getElementById("playIcon") ;
        img.src = (img.src.indexOf("stop") != -1)? "images/play.png" : "images/stop.png";
        (img.src.indexOf("play") != -1)? Player.stop() : Player.play();
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
/**
 * * Update
 * */
myListener.onUpdate = function()
{
};
function getFlashObject(num)
{
    return document.getElementById("fplayer"+num);
}
function play(num, id)
{
    if (myListener.position == 0) {
        getFlashObject(num).SetVariable("method:setUrl", "/mp3/"+id+".mp3 ");
    }
    getFlashObject(num).SetVariable("method:play", "");
    getFlashObject(num).SetVariable("enabled", "true");
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
    alert("vol"+num+"vol"+vol);
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
