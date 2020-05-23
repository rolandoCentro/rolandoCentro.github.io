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
	#define PI 3.14159265358979
	
	uniform sampler2D videoFeed;
	uniform vec2 time;
	uniform float depthInfluence;
	uniform float guiInput1;
	uniform float guiInput2;

	varying vec2 vUvCd;
	varying vec2 vUvAlpha;
	varying float height;
	

	vec2 modRes = vec2(64.0, 64.0);

	float map(float value, float min1, float max1, float min2, float max2) {
	  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
	}

	float random (in vec2 _st) {
	    return fract(sin(dot(_st.xy,
	                         vec2(12.9898,78.233)))*
	        43758.5453123);
	}

	mat2 rotate2d(float _angle){
	    return mat2(cos(_angle),-sin(_angle),
	                sin(_angle),cos(_angle));
	}


	void main()
	{

		vUvCd = uv;

		vec2 unitCoord		= vUvCd;
		vec2 multCoord 		= unitCoord*modRes;
		vec2 multFractCoord = fract(multCoord);

		float ramp = distance(unitCoord, vec2(0.5, 0.5));

		vec2 center = vec2(0.0, 0.0);

		float distanceMultiplier = 1.0/distance(vec2(0.5, 0.5), vec2(0.0,0.0));

		vec2 pixellate = vec2( floor(unitCoord.x * modRes.x) / modRes.x,
							   floor(unitCoord.y * modRes.y) / modRes.y) ;

		//a way to interpret time.x from a fraction to discrete options
		//float t = time.x * 0.001;
	 	 
	 	multFractCoord -= vec2(0.5);

	    multFractCoord = rotate2d( 0.25*PI ) * multFractCoord;

		float dist = distance(multFractCoord, center);
		float distPixellate = fract(distance(pixellate, vec2(0.5, 0.5))*distanceMultiplier-time.x);

		distPixellate *= 1.2;

		if(distPixellate > 1.0){

			distPixellate = map(distPixellate, 1.0, 1.1, 1.0, 0.0);

		}

		float rand = distPixellate*random(pixellate)*0.25-0.2;

		float sum;

		if(dist < 0.5){
			sum += 1.0-smoothstep(rand, rand+ 0.25, abs(multFractCoord.x));
			sum += 1.0-smoothstep(rand, rand+ 0.25, abs(multFractCoord.y));
			sum -= smoothstep(0.4, 0.5, dist);
		}

		ramp = smoothstep(0.5, 0.3, ramp);

		sum *= ramp;

		height = sum;
		vec3 pos = position + vec3(0,0,sum*depthInfluence);
		
		vec4 modelViewPosition=modelViewMatrix * vec4(pos, 1.0);
		gl_Position = projectionMatrix*modelViewPosition;

	}


	`;
	return ret;
}

function packedTextureFrag(){ // ## set gl common variables to defines
	let ret=`
	

	#ifdef GL_FRAGMENT_PRECISION_HIGH
		precision highp float;
	#else
		precision mediump float;
	#endif

	#define PI 3.14159265358979

	uniform sampler2D videoFeed;
	uniform vec2 time;
	uniform float depthInfluence;
	uniform float guiInput1;
	uniform float guiInput2;
	
	varying vec2 vUvCd;
	varying vec2 vUvAlpha;

	varying float height;

	void main()
	{

		vec4 color = vec4(height, height, height, 0.5);
		gl_FragColor = color;

	}


	`;
	return ret;
}






///////////////////////////////////////////////////
// -- ADD SOME CUSTOM OPTIONS TO THE PULL DOWN - //
///////////////////////////////////////////////////
// Extra options in the pull down
var packedTextureMaterial;
function addControlOptions(){
	datGuiParms.depthInfluence=10;
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
	var videoPlaneGeo = new THREE.PlaneGeometry( 1, 1, 512,512);
	
	var videoPlaneMesh = new THREE.Mesh( videoPlaneGeo, packedTextureMaterial );
	
	// Set position and rotation
	videoPlaneMesh.position.set(0,-10,-100);
	videoPlaneMesh.rotation.x=degToRad(-30);
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
		geoList['videoPlane'].scale.set(maxWidth, maxWidth, 1);
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
