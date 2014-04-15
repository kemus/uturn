Player.play = function (){
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
		return player;
	}
	else {
		return videoPlayer;
	}
}
function playVideo(video){
	player = acquirePlayer(video)	
	player.play()
}
function stopVideo(video){
	player = acquirePlayer(video)	
	player.pause()
}




function playbutton(){
	img = document.getElementById("playIcon") ;
        img.src = (img.src.indexOf("stop") != -1)? "images/play.png" : "images/stop.png";
        (img.src.indexOf("play") != -1)? Player.stop() : Player.play();
	return false;
}


