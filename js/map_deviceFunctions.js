
function getMouseXY(e){
	//e.preventDefault();
	if(touchScreen==0){
		let invert=invertMouse?-1:1;
		if(cursorLockActive){
			mouseX+=(e.movementX||e.mozMovementX||e.webkitMovementX||0)*invert;
			mouseY+=(e.movementY||e.mozMovementY||e.webkitMovementY||0)*invert;
		}else{
			mouseX=e.clientX;
			mouseY=e.clientY;
		}
	}else{
		try{
			touch = e.touches[0];
			mouseX = touch.pageX;
			mouseY = touch.pageY;
			//touchMouseData.startPos=new THREE.Vector2(mouseX,mouseY);
			//touchMouseData.endPos=new THREE.Vector2(mouseX,mouseY);
		}catch(err){}
	}
	//mapMouse.x=(mouseX/sW)*2 - 1;
	//mapMouse.y=-(mouseY/sH)*2 + 1;
}

function mapLockCursor(lock=false, name=null){
	if(canCursorLock){
		if(lock==true){
			mapCanvas.requestPointerLock();
			cursorLockActive=true;
		}else{
			document.exitPointerLock();
			cursorLockActive=false;
		}
	}
}

function mapOnDown(e){
	if( e.path[0].getAttribute("id") == mapCore){
		preventDefault;
		touchMouseData.button=e.which;
		touchMouseData.active=true;
		touchMouseData.mode=touchMouseData.button;
		touchMouseData.startPos=new THREE.Vector2(mouseX,mouseY);
		touchMouseData.endPos=new THREE.Vector2(mouseX,mouseY);
		touchMouseData.curDistance=new THREE.Vector2(0,0);
		touchMouseData.curStepDistance=new THREE.Vector2(0,0);
		touchMouseData.dragCount=0;
		setCursor("grabbing");
		mapLockCursor(true);
	}
}
function mapOnMove(e){
	if( e.path[0].getAttribute("id") == mapCore){
		preventDefault;
		getMouseXY(e);
		if(touchMouseData.active){
			touchMouseData.dragCount++;
			
			if(touchMouseData.dragCount == 8){
				if(!touchMouseData.latched){
					//setCursor("grabbing");
				}
				touchMouseData.latched=true;
			}
			/*if(touchMouseData.endPos!=null){
				touchMouseData.startPos.x=touchMouseData.endPos[0];
				touchMouseData.startPos.y=touchMouseData.endPos[1];
			}*/
			let xyDeltaTemp=touchMouseData.endPos.clone();
			touchMouseData.endPos=new THREE.Vector2(mouseX,mouseY);
			touchMouseData.curDistance= touchMouseData.startPos.clone().sub(touchMouseData.endPos) ;
			touchMouseData.curStepDistance = touchMouseData.endPos.clone().sub(xyDeltaTemp) ;
			touchMouseData.netDistance.add( touchMouseData.curStepDistance.clone() );
			let curvelocity=touchMouseData.velocity.clone();
			touchMouseData.velocity.add(touchMouseData.curStepDistance).multiplyScalar(.5);
			let curveleaseprev=touchMouseData.velocityEasePrev.clone();
			touchMouseData.velocityEasePrev=touchMouseData.velocityEase.clone();
			touchMouseData.velocityEase=curveleaseprev.clone().add(curvelocity.add(touchMouseData.velocity).multiplyScalar(.5)).multiplyScalar(.5);
			
			touchMouseData.netDistYPerc =  (touchMouseData.netDistance.y+touchMouseData.curDistance.y+250)/1250;
			touchMouseData.curFadeOut.add( xyDeltaTemp.sub(touchMouseData.endPos)  );
		}
	}
}
function mapOnUp(e){
	if( e.path[0].getAttribute("id") == mapCore){
		preventDefault;
		
		/*if(mapCamMode == 2){
			mapOnUpBook();
		}else{
			mapOnUpRayCaster();
		}*/
		//getMouseXY(e);
		touchMouseData.dragCount++;
		touchMouseData.dragTotal+=touchMouseData.dragCount;
		touchMouseData.active=false;
		
		touchMouseData.latched=false;
		touchMouseData.endPos=new THREE.Vector2(mouseX,mouseY);
		//touchMouseData.netDistance.add( touchMouseData.curDistance.clone() );
		//touchMouseData.netDistance.y = Math.max(-1000, Math.min(1500, touchMouseData.netDistance.y ));
		touchMouseData.netDistYPerc =  (touchMouseData.netDistance.y+250)/1250;
		touchMouseData.curDistance.multiplyScalar(0);
		touchMouseData.curStepDistance.multiplyScalar(0);
		setCursor("grab");
		
		mapLockCursor(false);
	}
}
function mouseWheel(e){ // Scroll wheel
	//Ehhhh IE be damned...
	// ... Bleh ... I'll address issues after MAP is done
	var delta=Math.sign(e.detail || e.wheelDelta);
	mouseWheelDelta+=delta;
	//if(mapCamMode == 2){
		mouseWheelDelta=Math.min(10, Math.max(-10, mouseWheelDelta));
		touchMouseData.zoomPerc=mouseWheelDelta/10;
	//}
	preventDefault;
}


document.onkeydown=function(e){keyDownCall(e);};
function keyDownCall(e){
	//e.preventDefault();
	if(document.activeElement.type==undefined){
		keyHit=e.keyCode || e.which;
		if(keyHit==37 || keyHit==65){ // Left
			directionKeyDown=true;
			//camMove([1,0]);
			keyDownCount[0]=mapQuality.fpsCounter.z;
			directionKeysPressed[0]=1;
		}
		if(e.ctrlKey && keyHit==87 && directionKeysPressed[1]==1){
			e.preventDefault();
		}
		if(keyHit==38 || keyHit==87){ // Up
			directionKeyDown=true;
			//camMove([1,0]);
			keyDownCount[1]=mapQuality.fpsCounter.z;
			directionKeysPressed[1]=1;
		}
		if(keyHit==39 || keyHit==68){ // Right
			directionKeyDown=true;
			//camMove([1,0]);
			keyDownCount[0]=mapQuality.fpsCounter.z;
			directionKeysPressed[2]=1;

		}
		if(keyHit==40 || keyHit==83){ // Down
			directionKeyDown=true;
			//camMove([0,-1]);
			keyDownCount[1]=mapQuality.fpsCounter.z;
			directionKeysPressed[3]=1;
		}
		if(keyHit==16){ // Shift
			shiftBoost=3;
		}
		if(keyHit==32 && cameraJumpHeight==0 && cameraAllowJump){
			keyDownCount[2]=prevMS;
			cameraJumpActive=true;
			cameraJumpInAir=true;
			cameraAllowJump=false;
			cameraJumpMaxHeight=0;
		}
	}
}
document.onkeyup=function(e){keyUpCall(e);};
function keyUpCall(e){
	//e.preventDefault();
	if(document.activeElement.type==undefined){
		keyHit=e.keyCode || e.which;
		
		if(keyHit==37 || keyHit==65){ // Left
			//camMove([1,0]);
			directionKeysPressed[0]=0;
		}
		if(keyHit==38 || keyHit==87){ // Up
			//camMove([1,0]);
			directionKeysPressed[1]=0;
		}
		if(keyHit==39 || keyHit==68){ // Right
			//camMove([1,0]);
			directionKeysPressed[2]=0;
		}
		if(keyHit==40 || keyHit==83){ // Down
			//camMove([0,-1]);
			directionKeysPressed[3]=0;
		}
		if(directionKeysPressed.indexOf(1)==-1){
			directionKeyDown=false;
		}
		
		if(keyHit==32){
			if(cameraJumpActive){ // Space
				cameraJumpMaxHeight=cameraJumpHeight;
				cameraJumpActive=false;
				keyDownCount[2]=prevMS;
			}
			cameraAllowJump=true;
		}
		
		if(keyHit==16){ // Shift
			shiftBoost=0;
		}
		// P 
		if(keyHit == 80){ //32){
			pausePlayback();
		}
		// F
		if(keyHit == 70){
			toggleMSLog();
		}
	}
}

function toHundreths(val){ // int(val*100)*.01 returns an erronious float on semi ussual basis...
	if(val===null) return "null";

	let sp=(val+"").split(".");
	if(sp.length == 1){
		return val;
	}else{
		let ret=sp[0]+"."+sp[1].substr(0,2);
		return ret;
	}
}