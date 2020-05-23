// Sorry, this file is a mess!
// There are many needless variables in here, but I didn't want to take the time to clean this out


var mapCore="map-core";
var mapEngine,mapRenderTarget,mapRenderBufferTarget,mapRenderTargetScaleArr,mapScalePassArr,ssaaOverlayAA;
var mapGl,mapCam,mapScene,mapBufferScene,mapAuxScene,mapComposer,mapComposerMotionBlur,mapComposerBloom,mapComposerGlow;
var mapResizerShader, mapDepthComposer,mapSlimComposer;
var mapDepthMaterial, blurScreenMerge, mapWorldPosMaterial, mapDepthMaterialMBlur, mapDepthMaterialBloom, mapAuxScene, mapDepthMaterialAux, mapDiscardMaterial;
var inputVideo;
var mapAutoQuality=1;
var mapQuality={
	'autoQuality':true,
	'screenResPerc':mobile?.8:1,
	'mBlurPercMult':mobile?.3:.5,
	'bloomPercMult':mobile?.3:.5,
	'bufferPercMult':1,//mobile?.3:.5,
	'renderTargetScale':10, // ## Not implemented
	'percent':8,
	'percentSteps':[.3,.5,.8],
	'fpsCounter':new THREE.Vector3(30, 0, (new Date().getTime())*.001), // [ Cur FPS, Frame Count Since Last FPS Check, Last FPS Sample Time ]
	'countAtLevel':0,
	'shiftRate':.01,
};
var mtlIntensity=new THREE.Vector2(0,1);
var mapPrompt=null;
var keyDownCount=[0,0,0];
var directionKeyDown=false;
var directionKeysPressed=[0,0,0,0];
var walkBounce=0;
var walkBounceSeed=230;
var walkBouncePerc=0;
var cloud3dTexture=null;

var assetRoot="images/assets/";
//var imageRoot="images/assets/images";
//var modelRoot="images/assets/models";
var visualizerRoot="images/assets/vizVideos/";
var screenRoot="images/assets/UserScreens/";

var mapCanvas,mapW,mapH;
var sW=window.innerWidth;
var sH=window.innerHeight;
var screenRes=[1/sW,1/sH];
var mapMouse=new THREE.Vector2();
var gyroGravity=[0,0,0];
var cameraMovement=[0,0]; // Left/Right, Forward/Back, Jump
var shiftBoost=0;
var gravMult=0;
var cameraJumpActive=false;
var cameraAllowJump=true;
var cameraJumpHeight=0;
var cameraJumpMaxHeight=0;
var cameraMaxJumpHold=.7; // 1 second
var cameraMaxJumpVelocity=5; // Units
var cameraJumpInAir=false;

var cameraPose={
	alpha:null,
	beta:null,
	gamma:null,
	alphaOffset:0,
	betaOffset:0,
	gammaOffset:0,
	orientation:window.orientation||0,
	pos:[0,0,0],
	posOffset:[0,0,0],
	rx:()=>{return this.beta},
	ry:()=>{return this.alpha},
	rz:()=>{return this.gamma},
	accelZeroed:[0,0,0],
	accelCalibration:10,
	accelCalDiv:1/10,
	accelCalCount:0,
	accelTotal:[0,0,0],
	accelPrev:null,
	accelDelta:[0,0,0],
	accelClearDelta:()=>{this.accelDelta=[0,0,0];},
};

var accumGravity=[0,0,0];
var cameraPoseEuler=null;
var verbGravityX,verbGravityY,verbGravityZ,verbErrorConsole;
var gyroscope;

//--------------------------

var options_renderResolution=mapQuality.screenResPerc;

var mapCamBooted=false;
var mapCamPrevPos=null;
var mapCamPrevLookAt=null;
var mapCamAim=new THREE.Vector3(0,0,1);
var mapCamAimTarget=null;
var lookAtLockPerc=1;
var lookAtOverlayPerc=1;
var lookAtLockFader=0;
var lookAtLockFadeRate=.01;

// ========================================
var mouseX=sW/2;
var mouseY=sH/2;
var touchMouseData={
	'active':0,
	'mode':0,
	'updated':0,
	'button':0,
	'latched':0,
	'latchedAxis':null,
	'dragCount':0,
	'dragTotal':0,
	'startPos':null, //vec2
	'moveMult':new THREE.Vector2(1.5,2.),
	'velocityEase':null,
	'velocityEasePrev':null,
	'velocity':null, //vec2
	'mBlurVelInf':new THREE.Vector2(2*screenRes[0],2*screenRes[1]), //[2,2],
	'prevDeltaPos':[0,0,0], //vec2
	'endPos':null, //  [x,y] 
	'latchMatrix':null, // Mat4
	'netDistance':null, //vec2
	'netDistYPerc':0, //vec2
	'curDistance':null, //vec2
	'curFadeOut':null, //vec2
	'curStepDistance':null, //vec2
	'zoomPerc':0,
};

var canCursorLock=
	'pointerLockElement' in document||
	'mozPointerLockElement' in document ||
	'webkitPointerLockElement' in document;
var cursorLockActive=false;


var prevMotionBlurDir=[0,0];
var mouseWheelEvt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel" ;
var mouseWheelDelta=0;
var IE = document.all?true:false;
var touch =0;
var touchScreen=0;
var startTime=Date.now();
var groupList=[];
var geoList=[];
var colliderList=[];
var antiColliderList=[];
var portalList={};
var geoLoadList=[]; // 0 Not loaded, 1 Loaded, 2 Loaded and Processed (Setting Dependants)
var geoLoadListComplete=0;
var lightList=[];
var mapPause=0;
var runner=-1;
var msRunner=new THREE.Vector2(0,0);
var prevMS=new Date().getTime()*.001;
var objsBooted=0;
var particlesBooted=0;
var pi=3.14159265358979;

var tankStrafe=true;
var invertMouse=false;

// ========================================

var texLoader;
var textLoaderArray=[];
var objRaycast=-1;
var objRayLoadCount=0;
var objRayList=[];
var objRayCurHit;
var msLog=0;
var datGui=-1;
var fpsStats=-1;
var datGuiParms=null;



// Composer Passes
var stepShaderFuncArr=[];
var mapMotionBlurPass=null;
var mapCopyMotionBlurPass=null;
var mapOverlayPass=null;
var mapGlowPass=null;
var mapGlowMotionBlur=null;
var datRenderResolutionSlider=null;
var datBloomExp=null;
var datBloomRadius=null;
var datBloomStrength=null;
var datBloomThresh=null;
var datShadowSlider=null;
var datQualityButton=null;
var datPauseButton=null;
var datTankButton=null;
var datMouseInvertButton=null;
var datStatsButton=null;

var textureRoot="assets/mtls/";
var spriteRoot=textureRoot+"spriteAtlases/";
var objectRoot="assets/objs/";
var textureList;

var curLayer=1;

var instanceVisibility=new THREE.Vector2(1,0);

//--------------------------

var glowHits=0;
var glowPlay=-1;
var glowPlayMax=300;
var glowTime=0;
var glowPerc=0;
var targetHoverPrev=0;
var blendFitPrev=0;

//--------------------------

var spriteGroups=[];
var renderBuffer=null;
var depthCamera=null;
var depthScene=null;
var depthShader=null;
var applyMaskShader=null;
var diffuseShader=null;
var diffusePass=null;
var diffuseShaderPass=null;
var maskPass=null;
var maskShaderPass=null;
var floorColliderInitialHit=false;
var colliderPrevObjHit=null;
var colliderVolAdjustDiv=null;
var colliderVolAdjustActive=true;
var colliderVolAdjust=0;
var colliderVolMax=1;
var colliderVolMin=.1;
var colliderVolRate=.020;


// Test Web Cam
var localWebcamVideo=null;
var remoteVideoTextureList=[];
var remoteVideoNameList=[];
var remoteParticipants=null;
const camScreenData={
	prevCount:0,
	checkUserCount:true,
	checkVideoStatus:true,
	findCamCount:()=>{
			
		},
	videoObjectList:[],
	screenGeoList:[],
	screenClickable:[],
	screenVisualizerList:[],
	screenMtlUniforms:[],
	userDataList:[],
	camFindInfoList:[]
};
var screenGeoList=[];
var screenVisualizerList=[];
var screenWebcamObject

var visualizerPaths=[
	visualizerRoot+"oscillating_circles.gif",
	visualizerRoot+"roadVortex.gif",
	visualizerRoot+"spikedSplot.gif",
	visualizerRoot+"triBars_green.gif"
];
