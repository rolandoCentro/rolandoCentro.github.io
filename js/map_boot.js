
function preventDefault(e){
    e=e||window.event;
    if (e.preventDefault){
        e.preventDefault();
    }
    e.returnValue=false;
}

function boot(){
	if(verbose){
		console.log(mapToDoList);
		console.log("Verbose console logs are ON");
	}
	document.onmousemove=function(e){mapOnMove(e);};
	document.onmousedown=function(e){mapOnDown(e);};
	document.onmouseup=function(e){mapOnUp(e);};
    document.addEventListener(mouseWheelEvt, function(e) {mouseWheel(e);}, false)
	window.onresize=function(e){resizeRenderResolution();};
	
	verbErrorConsole=document.getElementById("verbErrorConsole");
	// Verbose to screen on error
	window.onerror=(msg,source,line,col,err)=>{
		verbErrorConsole.innerHTML+="<br>---<br>"+msg;
		verbErrorConsole.innerHTML+="<br>"+source;
		verbErrorConsole.innerHTML+="<br>Line - "+line+" | Col - "+col;
		verbErrorConsole.innerHTML+="<br>"+err;
	};
		
	mapCanvas=document.getElementById(mapCore);
	mapW=window.innerWidth*mapQuality.screenResPerc;
	mapCanvas.width=window.innerWidth;
	mapH=window.innerHeight*mapQuality.screenResPerc;
	mapCanvas.height=window.innerHeight;
	if(canCursorLock){
		mapCanvas.requestPointerLock=
				mapCanvas.requestPointerLock ||
				mapCanvas.mozRequestPointerLock ||
				mapCanvas.webkitRequestPointerLock;
		document.requestPointerLock=
				mapCanvas.exitPointerLock ||
				mapCanvas.mozExitPointerLock ||
				mapCanvas.webkitExitPointerLock;
	}
	
	touchMouseData.curDistance=new THREE.Vector2(0,0);
	touchMouseData.curStepDistance=new THREE.Vector2(0,0);
	touchMouseData.curFadeOut=new THREE.Vector2(0,0);
	touchMouseData.netDistance=new THREE.Vector2(0,0);
	touchMouseData.velocity=new THREE.Vector2(0,0);
	touchMouseData.velocityEase=new THREE.Vector2(0,0);
	touchMouseData.velocityEasePrev=new THREE.Vector2(0,0);
	
	
	var inputNode = document.querySelector('input');
	inputNode.addEventListener('change', playSelectedFile, false);


	mapPrepGUI();
	mapBootEngine();
	
	resizeRenderResolution();
	mapCamRunAnimator();
	mapRender();
	setCursor("grab");
}

function resizeRenderResolution(){
	mapW=(sW=window.innerWidth)*mapQuality.screenResPerc;
	mapH=(sH=window.innerHeight)*mapQuality.screenResPerc;
	
	mapCanvas.width=mapW;
	mapCanvas.height=mapH;
	
	mapEngine.setPixelRatio(window.devicePixelRatio);
	mapEngine.setSize(mapW/mapQuality.screenResPerc, mapH/mapQuality.screenResPerc);
	var aspectRatio=mapW/mapH;
	mapCam.aspect=aspectRatio;
	mapCam.updateProjectionMatrix();
	//mapEngine.render(mapScene,mapCam);
}


function mapFpsQualitCheck(){
	var curMS=new Date().getTime()*.001;
	let msDelta=curMS-prevMS;
	msRunner.add(new THREE.Vector2( (msDelta>0?msDelta:0), 0) );
	prevMS=curMS;
}

function pausePlayback(){
	mapPause=(mapPause+1)%2;
	if(mapPause==0){
		mapRender();
	}
	if(datPauseButton){
		if(mapPause == 1){
			datPauseButton.name("Start Playback");
		}else{
			datPauseButton.name("Pause Playback");
		}
	}
}

function setCursor(cursorType){
	if(cursorType == "activeLatch"){
		if(touchMouseData.button==0){
			cursorType="grab";
		}else if(touchMouseData.button==1){
			cursorType="grabbing";
		}else if(touchMouseData.button==2){
			cursorType="all-scroll";
		}
	}
	document.body.style.cursor=cursorType;
}

function toggleMSLog(){
	msLog=(msLog+1)%2;
}
function msLogDisp(reset=0){
	msLog=(msLog+1)%2;
}

function toggleMaskRender(){
	maskRender=(maskRender+1)%3;
	diffuseShader.uniforms.maskDisplay.value=maskRender;
}

function mapPrepGUI(){
	datGui=new dat.gui.GUI();
	datGui.domElement.parentElement.style.zIndex=102;
	datGui.domElement.parentElement.style.position="absolute";
	datGui.domElement.parentElement.style.left="0px";
	datGui.closed=true;
	datGuiParms={
		pause:function(){
			pausePlayback();
			if(datPauseButton!=-1){
				if(mapPause == 1){
					datPauseButton.name("Start Playback");
				}else{
					datPauseButton.name("Pause Playback");
				}
			}
		},
		tankRotate:function(){
			tankStrafe=!tankStrafe;
			datTankButton.name( ( tankStrafe ? "Left/Right Rotation" : "Left/Right Strafe") );
		},
		mouseInf:function(){
			invertMouse=!invertMouse;
			datMouseInvertButton.name( ( invertMouse ? "Revert Mouse" : "Invert Mouse") );
		},
		stats:function(){
			if(fpsStats == -1){
				fpsStats=new Stats();
				document.body.appendChild(fpsStats.domElement);
				fpsStats.update();
				datStatsButton.name("Hide FPS Stats");
			}else{
				fpsStats.domElement.remove();
				fpsStats=-1;
				datStatsButton.name("Display FPS Stats");
			}
		}
	};

	addControlOptions();

	////
	datPauseButton=datGui.add(datGuiParms,'pause').name("Pause Playback");
	datTankButton=datGui.add(datGuiParms,'tankRotate').name("Left/Right Strafe");
	datMouseInvertButton=datGui.add(datGuiParms,'mouseInf').name("Invert Mouse");
	datStatsButton=datGui.add(datGuiParms,'stats').name("Display FPS Stats");
}


function degToRad(deg){
	return deg*0.017453292519943295;//  Math.PI/180;
}

//////////////////////////////////////

var verboseLoading=new THREE.LoadingManager();
verboseLoading.onProgress=function(i,l,t){
	if(verbose){console.log(i,l,t);}
};

var onProgress=function(xhr){
	if(verbose && xhr.lengthComputable){
		var perc=xhr.loaded/xhr.total * 100;
		console.log(parseInt(perc)+" downloaded");
	}
};
var onError=function(xhr){
	if(verbose){console.log("ERROR! - Real descriptive...");}
}
var onLoad=null;












//// http://jsfiddle.net/dsbonev/cCCZ2/embedded/result,js,html,css/
  var playSelectedFile = function (event) {
    var file = this.files[0]
    var type = file.type
    var videoNode = document.querySelector('video')
    var canPlay = videoNode.canPlayType(type)
    if (canPlay === '') canPlay = 'no'
    var message = 'Can play type "' + type + '": ' + canPlay
    var isError = canPlay === 'no'

    if (isError) {
      return
    }

    var fileURL = URL.createObjectURL(file)
    videoNode.src = fileURL
  }











