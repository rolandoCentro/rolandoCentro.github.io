// -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- //
/*

Hey Rolando,
  Below you'll see 3 sections,
    GLSL Shaders
	Custom Options and setting up a shader on a plane
	All other ThreeJS Renderer Engine prep

  I've set up 3 custom gui pulldown options you can use easily,
    Add more in the function -
	  addControlOptions()
	
  To create a new GLSL Shader Material,
    You can look in -
	  createVideoTextureObject()
	Keep in mind the variable `packedTextureMaterial` is a global for easy access
	You could also access a material on an object with-
	  MeshObject.material..uniforms.**UNIFORM_NAME**.value

 - - - - - - - - - - - -
 
    You can edit the default settings for depth in -
	
      function addControlOptions(){
		  datGuiParms.depthInfluence=20;
	    ...
	  }

 - - - - - - - - - - - -
 
  ThreeJS Variable Uses --
  ** They are treated like Javascript Array Variables **
  ** Shared memory locations, so editing on array can change another array **
 
  In the shader I put below, you'll see -
	msRunner
  The variable is a THREE.Vector2()
    msRunner.x = Current Second since starting
	msRunner.y = 0
  When it's values change, it automatically updates the uniform in the shader its used in
  
  The reason?
  Updating Shader material uniform values every frame is extremely slow
  
  I left the custom GUI pull down options set the uniform values because they don't change much
    Just easier to not use a THREE.Vector2() then

 ---
 
  That being said, if you ever want to make two ThreeJS variables equal each other, like
    let var1 = new THREE.Vector3( 2, 3, 5);
	let var2 = var1;
	
	var1.x=10;
	
  var2 will now equal {x:10, y:3, z:5};
  
  You can get around this by doing -
    let var2 = var1.clone();
	

*/
// -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- //







///////////////////////////////////////////////////
// -- GLSL SHADERS -- -- -- -- -- -- -- -- -- -- //
///////////////////////////////////////////////////
function packedTextureVert(){
	let ret=`
	#ifdef GL_FRAGMENT_PRECISION_HIGH
		precision highp float;
	#else
		precision mediump float;
	#endif
	#define PI 3.14159265358979;
	
	uniform sampler2D videoFeed;
	uniform vec2 time;
	uniform float depthInfluence;
	uniform float guiInput1;
	uniform float guiInput2;
	
	varying vec2 vUvCd;
	varying vec2 vUvAlpha;
	
	void main(){
		vec2 depthUVs=uv*.5;
		vec2 colorUVs=depthUVs + vec2( 0.0, 0.5 );
		vec2 alphaUVs=colorUVs + vec2( 0.5, 0.0 );
		
		// Theres a single line of white pixels at the bottom of the image
		depthUVs.y=depthUVs.y*.98+.01; 

		// To read in the frag shader
		vUvCd=colorUVs;
		vUvAlpha=alphaUVs;
		
		float depthCd=texture2D(videoFeed,depthUVs).r;
		vec3 pos=position + vec3( 0.0, 0.0, depthCd*depthInfluence );
		
		vec4 modelViewPosition=modelViewMatrix * vec4(pos, 1.0);
		gl_Position = projectionMatrix*modelViewPosition;
	}`;
	return ret;
}

function packedTextureFrag(){ // ## set gl common variables to defines
	let ret=`
	#ifdef GL_FRAGMENT_PRECISION_HIGH
		precision highp float;
	#else
		precision mediump float;
	#endif
	#define PI 3.14159265358979;
	
	uniform sampler2D videoFeed;
	uniform vec2 time;
	uniform float depthInfluence;
	uniform float guiInput1;
	uniform float guiInput2;
	
	varying vec2 vUvCd;
	varying vec2 vUvAlpha;
	
	void main(){
		//vec4 Cd=texture2D(videoFeed,vUvCd);
		vec4 Cd=vec4(1.0);
		float Alpha=texture2D(videoFeed,vUvAlpha).r;
		Cd.a=Alpha;
		gl_FragColor=Cd;
	}`;
	return ret;
}






///////////////////////////////////////////////////
// -- ADD SOME CUSTOM OPTIONS TO THE PULL DOWN - //
///////////////////////////////////////////////////
// Extra options in the pull down
var packedTextureMaterial;
function addControlOptions(){
	datGuiParms.depthInfluence=20;
	datGui.add(datGuiParms,'depthInfluence').name("Shader Depth").min(0).max(50).step(.1).onChange(function(val){
		packedTextureMaterial.uniforms.depthInfluence.value = Number( val );
	});
	
	datGuiParms.guiInput1=1;
	datGui.add(datGuiParms,'guiInput1').name("Variable 1").min(0).max(10).step(.1).onChange(function(val){
		packedTextureMaterial.uniforms.guiInput1.value = Number( val );
	});
	
	datGuiParms.guiInput2=1;
	datGui.add(datGuiParms,'guiInput2').name("Variable 2").min(0).max(10).step(.1).onChange(function(val){
		packedTextureMaterial.uniforms.guiInput2.value = Number( val );
	});
}

// Use the video as an input texture for a shader
function createVideoTextureObject(){
	packedTextureMaterial=new THREE.ShaderMaterial({
		uniforms:{
			// This is a THREE.Vector2, it automatically updates when msRunner.x is set
			time:{ value:msRunner }, 
			
			// Adding a texture as a Sampler2d Uniform
			videoFeed:{ value:vidTexture }, 
			
			// Menu options from the pulldown
			depthInfluence: { type:"f", value: datGuiParms.depthInfluence },
			guiInput1: { type:"f", value: datGuiParms.guiInput1 },
			guiInput2: { type:"f", value: datGuiParms.guiInput2 }
		},
		
		// Your vert shader above
		vertexShader:packedTextureVert(),
		
		// Your frag shader above
		fragmentShader:packedTextureFrag(),
		
		// Extra THREE.Material options --
		transparent:true,
		side:THREE.DoubleSide
	});
	
	// Leave the scale 1,1; I'm updating the scale on the mesh when the video loads
	// 960,540 is the x and y polygon count of the video plane
	var videoPlaneGeo = new THREE.PlaneGeometry( 1, 1, 960,540 );
	
	var videoPlaneMesh = new THREE.Mesh( videoPlaneGeo, packedTextureMaterial );
	
	// Set position and rotation
	videoPlaneMesh.position.set(0,20,-100);
	videoPlaneMesh.rotation.x=degToRad(-20);
	videoPlaneMesh.scale.set(0,0,0);
	
	// Add object to scene
	mapScene.add( videoPlaneMesh );
	
	// For easy access from the web developer console and access through javascript
	geoList['videoPlane']=videoPlaneMesh;
}







///////////////////////////////////////////////////
// -- ENGINE PREP  &  SCENE -- -- -- -- -- -- -- //
///////////////////////////////////////////////////
function mapBootEngine(){
	// Rederer
	mapEngine=new THREE.WebGLRenderer({
		canvas: mapCanvas,
		alpha:true,
		antialias: true,
		sortObjects:true,
	});
	var options = {
		format : THREE.RGBFormat,
		antialias: true,
		sortObjects:true,
		alpha:true,
		type : /(iPad|iPhone|iPod)/g.test(navigator.userAgent) ? THREE.HalfFloatType : THREE.FloatType
	};
	mapEngine.autoClear=false; // Clear prior render before new render
	
	mapEngine.setClearColor(0x000000, 0);
	mapEngine.setPixelRatio(window.devicePixelRatio);
	mapEngine.setSize(mapW/mapQuality.screenResPerc, mapH/mapQuality.screenResPerc);
	
	mapScene=new THREE.Scene();
	mapScene.background = new THREE.Color(0,0,0);
	
	var aspectRatio=mapCanvas.width/mapCanvas.height;
	mapCam=new THREE.PerspectiveCamera(60,aspectRatio, 1, 10000);
	//mapCam.position.set(-20,0,15); // Camera position

	
	///////////////////////////////////////////////////
	// -- GEOMETRY  -- -- -- -- -- -- -- -- -- -- -- //
	///////////////////////////////////////////////////
	// Texture needs
	var textureList;
	var transformList;
	texLoader=new THREE.ImageLoader();
	objRaycast=new THREE.Raycaster();
	
	// When the video object loads, set the videoTexture mesh object's height and width
	inputVideo=document.getElementById("inputVideo");
	inputVideo.onloadedmetadata=(e)=>{
		let ratio=inputVideo.videoHeight/inputVideo.videoWidth;
		let maxWidth=200;
		geoList['videoPlane'].scale.set(maxWidth, maxWidth*ratio, 1);
		inputVideo.play();
	}
	
	// This will not work without a web server!
	if(window.location.href.indexOf("file://")==-1){
		inputVideo.src="texturePackTest.mov";
	}
	
	inputVideo.play();
	console.log(inputVideo);
	vidTexture=new THREE.VideoTexture(inputVideo);
	vidTexture.minFilter=THREE.LinearFilter;
	vidTexture.magFilter=THREE.LinearFilter;
	vidTexture.format=THREE.RGBFormat;
	
	// Create the video texture object
	createVideoTextureObject();
	
	
	/*
	// Load an image to a texture
	//  This is using the texLoader variable but sets some texture settings
	cloud3dTexture=map_loadTexture("assets/cloud3d.jpg", verboseLoading);
	cloud3dTexture.minFilter.value=THREE.LinearFilter;
	cloud3dTexture.magFilter.value=THREE.LinearFilter;
	*/




	/*
	// If you want to load a custom FBX with a custom shader
		var loadedFBX=map_loadSceneFBX("", null,'yourFBX',mapScene);
	// After loading, you can access your fbx from the array - geoList['yourFBX'];
	*/
	
	/*
	// If you want to load a custom FBX with a custom shader
		// Basic shader loader
		let fbxShader=new THREE.ShaderMaterial({
			uniforms:{
				time:{ value:msRunner },
				intensity: { type:"f", value: 2.0 },
				rate: { type:"f", value: 3.0 },
				freq: { type:"f", value: 4.0 }
			},
			vertexShader:shaderVert(),
			fragmentShader:shaderFrag(),
			transparent:true,
			side:THREE.DoubleSide
		});
		// Load an FBX with your fbxShader applied to every object
		var timesSquareFBX=map_loadSceneFBX("", fbxShader,'your',mapScene);
	*/

	///////////////////////////////////////////////////
	// -- LIGHTS -- -- -- -- -- -- -- -- -- -- -- -- //
	///////////////////////////////////////////////////

	//Shadow Maps-
	mapEngine.shadowMap.enabled=false;
	// Low quality shadows
	//	mapEngine.shadowMap.type=THREE.BasicShadowMap;
	// Higher quality shadows
	//	mapEngine.shadowMap.type=THREE.PCFSoftShadowMap;
	
	// Some lights maybe
	var ambLight=new THREE.AmbientLight(0xffffff,.07);
	lightList.push(ambLight);
	mapScene.add(ambLight);
	var dirLight=new THREE.DirectionalLight(0xffffff,.4);
	dirLight.position.set(1000,550,1200);
	lightList.push(dirLight);
	mapScene.add(dirLight);
	var dirLightB=new THREE.DirectionalLight(0xffffff,.2);
	dirLightB.position.set(-500,750,1500);
	lightList.push(dirLightB);
	mapScene.add(dirLightB);
	
}
