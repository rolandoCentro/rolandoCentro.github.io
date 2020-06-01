// Booted or NonBooted
// After booting, run the last timeout
function mapCamRunAnimator(){
	let stillLoadingCheck=false;
	let keys=Object.keys(geoLoadList);
	for(let x=0; x<keys.length; ++x){ // Check if any objects are still loading
		stillLoadingCheck=geoLoadList[keys[x]]==0;
		if(stillLoadingCheck){ // If entry isn't 1, means not fully loaded
			break;
		}
	}
	if(stillLoadingCheck){ // Files are still loading
		setTimeout(()=>{
			mapCamRunAnimator()
		},100);
	}else{
		setTimeout(()=>{
			// Fade out lock
			lookAtLockPerc=1;
			lookAtLockFader=-1;
		},100);
	}
}

function camMove(curTime){
	let rate=[0,0];//
	let dir=[...directionKeysPressed];
	let strafe=0;
	let truck=0;
	let deltas=[ (curTime-keyDownCount[0]), (curTime-keyDownCount[1]) ]; // 1.000 seconds
	if((dir[0]+dir[2])==1){
		strafe=dir[2]-dir[0];
		rate[0]=3.0;
	}else{
		keyDownCount[0]=0;
	}
	if((dir[1]+dir[3])==1){
		truck=dir[3]-dir[1];
		if(shiftBoost>0) shiftBoost+=1;
		rate[1]=3.0+shiftBoost*.1;
	}else{
		keyDownCount[1]=0;
		shiftBoost=0;
	}
	cameraMovement[0]+=strafe*rate[0];
	cameraMovement[1]+=truck*rate[1];
}

function camJump(curTime){	
	let jumpOffset=0;
	let jumpRate=0;
	let jumpPerc=Math.min(1, (curTime-keyDownCount[2])/cameraMaxJumpHold );
	if(cameraJumpActive){
		jumpRate=jumpPerc ;
		if(jumpRate==1){
			cameraJumpActive=false;
			jumpRate=0;
		}else{
			jumpRate=(1-jumpRate)*(1-jumpRate);
			jumpRate*=jumpRate;
		}
	}
	gravMult=cameraJumpActive ? Math.max(0, Math.min(2, jumpPerc-.5 ))*.5 : gravMult+.1*((cameraJumpMaxHeight+2)*.02) ;
	jumpOffset=cameraMaxJumpVelocity*jumpRate -9.8*gravMult;
	cameraJumpHeight=Math.max(0, cameraJumpHeight+jumpOffset );
	cameraJumpMaxHeight=Math.max(cameraJumpMaxHeight, cameraJumpHeight);
	if(cameraJumpHeight==0) cameraJumpInAir=false;
}


function mapUpdateCamera(){
	let mapCamPos=mapCamPrevPos!=null? mapCamPrevPos.clone() : new THREE.Vector3(0, 0, 0);
	
	
	var dirSign=1;
	var panMult=1.5;
	var panOff=0;//-.35;
	var xyOffsets=touchMouseData.curStepDistance.clone().normalize();//.multiplyScalar(1.0);//touchMouseData.netDistance.clone().add(touchMouseData.curDistance).multiplyScalar(.0015);
	xyOffsets.multiply( touchMouseData.moveMult );
	if(!tankStrafe){
		let tankRotate=-cameraMovement[0]*1;
		touchMouseData.velocity.x+=tankRotate;
		touchMouseData.velocityEase.x+=tankRotate;
	}
	
	// PC Mouse Movement
	if(touchMouseData.velocity!=null && mobile==0){
		touchMouseData.velocity.multiplyScalar(.7);
		touchMouseData.velocityEase.multiplyScalar(.7);
		if(!touchMouseData.active){
			xyOffsets.add( touchMouseData.velocity.clone() );
			touchMouseData.netDistance.add( touchMouseData.velocity.clone().multiply( touchMouseData.moveMult ) );
		}
	}
	let camOrigPos=mapCam.position.clone();
	let camOrigQuat=mapCam.quaternion.clone();
	let camOrigWorldMat=mapCam.matrixWorld.clone();
	
	// Add bob to movement to appear as taking steps
	if(cameraMovement[1]!=0){//cameraMovement[0]!=0 || cameraMovement[1]!=0){directionKeyDown){
		walkBouncePerc=walkBouncePerc>=1?1:walkBouncePerc+.05;
		walkBounce+=1;
	}else{
		walkBouncePerc*=.9;
		if(walkBouncePerc<.03){
			walkBouncePerc=0;
			walkBounce=0;
			walkBounceSeed=Math.random()*2351.3256;
		}
	}
	let walkBounceOffset=Math.sin(walkBounce*.4+walkBounceSeed+cameraMovement[1]*.2)*walkBouncePerc*.3;


	
	var camOffsetPos,camOffsetLookPos,yPercLook;
	var camPosBlend=.5; // Prev Pos Blend
	var blend=.5; // Mode Blend
	
	var yPerc=(mouseY/sH);
	
	//var randomPos=(x)=>[Math.random(x)*.5-.5,Math.random(x)*.5,Math.random(x+2)*.5-.5];	
	//var randomSmoothUnsign=(x,time=1,mult=1)=>[(Math.sin(x*91527.5194+time)*.5-.5)*mult,(Math.sin(-x*3259.751-time)*.5-.5)*mult,(Math.cos((x+2)*7519.762+time)*.5-.5)*mult];	
	//var randomSmooth=(x,time=1,mult=1)=>new THREE.Vector3((Math.sin(x*91527.5194+time))*mult,(Math.sin(-x*3259.751-time))*mult,(Math.cos((x+2)*7519.762+time))*mult);	
	
	var fadeOffsetTarget = new THREE.Vector3( -touchMouseData.curFadeOut.x, touchMouseData.curFadeOut.y, 0 ).multiplyScalar(.01).applyMatrix3( new THREE.Matrix3().setFromMatrix4( mapCam.matrixWorld ) );

	///////////////////////////////////
	// Camera Position Calculations
	//   Apply WASD / Arrow Key / Tap Drag movement offsets
	let userMovement;
	let moveLength=0;
	//dedault moveLengthMult 1.5
	let moveLengthMult=5;
	let worldOffset=new THREE.Vector3(0,0,0);
	
	if(!mapCamBooted){
		mapCamPrevPos=new THREE.Vector3(mapCamPos.clone());
		mapCamPrevLookAt=new THREE.Vector3();
	}else{
		if(mobile){
			userMovement=new THREE.Vector3(-touchMouseData.curDistance.x*.01,0,-touchMouseData.curDistance.y*.01);
			moveLength=userMovement.length();
		}else{
			//userMovement=new THREE.Vector3(cameraMovement[0],0,cameraMovement[1]);
			userMovement=new THREE.Vector3((tankStrafe?cameraMovement[0]*.5:0),0,cameraMovement[1]);
			moveLength=userMovement.length();
		}
		userMovement.applyQuaternion(mapCam.quaternion);
		userMovement.normalize().multiply(new THREE.Vector3(1,0,1)).multiplyScalar(moveLength*moveLengthMult);
		mapCamPos.add(userMovement);
		
		cameraMovement=[0,0];
		
		mapCamPos=mapCamPos.clone().multiplyScalar(camPosBlend).add(mapCamPrevPos.clone().multiplyScalar(1-camPosBlend));
	}	

	
	mapCamPrevPos=mapCamPos.clone();
	mapCamPos.y+=15+walkBounceOffset+cameraJumpHeight;
	mapCam.position.copy(mapCamPos);
	
	///////////////////////////////////////////////////////
	
	/////////////////////
	// Camera Rotation; Look At(Aim) Target
	let camLookAt=new THREE.Vector3();
	let xGrav=gyroGravity[2];//*gravMult;//*PI;
	let offsetRotation=[pi,0,-pi];
	offsetRotation[2]=offsetRotation[0];
	// Initial starting look at positions
	if(mobile==1){
		camLookAt.set( Math.sin(xGrav+offsetRotation[0])*10, 7.5+offsetRotation[1], Math.cos(xGrav+offsetRotation[2])*10 );
	}else{
		camLookAt.set( Math.sin(touchMouseData.netDistance.x/sW*1.5+xGrav+offsetRotation[0])*10, (touchMouseData.netDistance.y/sH+offsetRotation[1])*10, Math.cos(touchMouseData.netDistance.x/sW*1.5+xGrav+offsetRotation[2])*10 );
	}
	
	camLookAt.add(mapCamPos);
	
	mapCam.lookAt(camLookAt);
	if(!mapCamBooted){
		camPosBlend=.8;
		camLookAt.multiplyScalar(camPosBlend).add( mapCamPrevLookAt.multiplyScalar(1-camPosBlend) );
	}
	mapCam.lookAt(camLookAt);
	mapCamPrevLookAt=camLookAt.clone();
		
	mapCam.updateMatrixWorld();
	let camQuat=mapCam.quaternion;
	
	
	mapCamBooted=true;
}
