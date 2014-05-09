function playbutton(){
    img = document.getElementById("playIcon") ;
        img.src = (img.src.indexOf("stop") != -1)? "images/play.png" : "images/stop.png";
        (img.src.indexOf("play") != -1)? Player.stop() : Player.play();
    return false;
}
Player.play = function (){
    Player['video'].forEach(waitVideo);
    Player['video'].forEach(playVideo);
}


Player.stop = function (){
    Player['video'].forEach(stopVideo);
}
function acquirePlayer(video){
    playerDiv = document.getElementById("playerDiv") ;
    videoPlayer = playerDiv.querySelector("#vid" + video["id"]);
    if (! videoPlayer){
        player = document.createElement('audio');
        playerDiv.appendChild(player);
        player.src = 'wav/'+video['id']+'.wav';
        player.id = 'vid' + video['id'];
        debug('player ' + player.id + 'created');
        return player;
    }
    else {
        debug('olayer acquired' + videoPlayer.id);
        return videoPlayer;
    }
}
function playVideo(video){
    player = acquirePlayer(video);
    player.currentTime = 0;
    player.play();
    debug("played: " + player.id);
}
function stopVideo(video){
    player = acquirePlayer(video);
    player.pause();
    debug("paused: " + player.id);
}

function waitVideo(video){
    player = acquirePlayer(video);
    while (! player.readyState);
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
		out = [{type:'volume' , amount : -1*c.amount, time : c.selectStart},{ type: 'volume', amount: c.amount, time : c.selectStop}].concat(cs)
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
	//		if (c.selectStart< cs[i].time && cs[i].time < c.selectStop){
//				if(cs[i].type == 'amplify'){
//					toAdd = toAdd.concat([{type:'volume' , amount : -1*cs[i].amount, time : c.selectStop+amount}]);
//					toAdd = toAdd.concat([{type:'volume' , amount : cs[i].amount, time : c.selectStart+amount}]);
//					cs[i].time += c.amount;
//				}
//				
//			}
//
//			i++;
//		}
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


function acquirePlayer(video){
    playerDiv = document.getElementById("playerDiv") ;
    videoPlayer = playerDiv.querySelector("#vid" + video["id"]);
    if (! videoPlayer){
        player = document.createElement('audio');
        playerDiv.appendChild(player);
        player.src = 'wav/'+video['id']+'.wav';
        player.id = 'vid' + video['id'];
        debug('player ' + player.id + 'created');
        return player;
    }
    else {
        debug('olayer acquired' + videoPlayer.id);
        return videoPlayer;
    }
}
function playVideo(video){
    //alert(video["id"])
    player = acquirePlayer(video);
    player.currentTime = 0;
    player.volume = 0.5;
    video.commands.forEach(function (command) {
		if(command.type == "volume"){
			setTimeout(function(){player.volume += command.amount;}, command.time*1000/tau);
			}
		if(command.type == "start"){
    			setTimeout(function(){
				player.pause();
				t = command.from/tau;
        			player.src = 'wav/'+video['id']+'.wav#t='+t;
				player.play();
                                setPlayTick(player.currentTime);
				function f() {setPlayTick(Math.floor(player.currentTime*tau))}
                                interval = setInterval(f,100);
				//alert("play");
				},command.time*1000/tau);
		}

		if(command.type == "stop"){
    			setTimeout(function(){
				player.currentTime = command.time/tau;	
				player.pause();
				},command.time*1000/tau);
		}}
		 );
    debug("played: " + player.id);
}
function stopVideo(video){
    //alert("death");
    player = acquirePlayer(video);
    player.pause();
    debug("paused: " + player.id);

    window.clearInterval(interval);
}


function playbutton(){
    interpretActions();
    img = document.getElementById("playIcon") ;
        img.src = (img.src.indexOf("stop") != -1)? "images/play.png" : "images/stop.png";
        (img.src.indexOf("play") != -1)? Player.stop() : Player.play();
    return false;
}/*









*/
