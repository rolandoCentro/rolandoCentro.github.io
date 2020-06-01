

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
	uniform float beatMultiplier;

	varying vec2 vUvCd;
	varying vec2 vUvAlpha;
	varying float height;

	vec2 modRes = vec2(64.0, 64.0);

	///position for distance measurement, the center of the circle
	vec2 center = vec2(0.5, 0.5);

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

	///noise stuff
	vec4 permute(vec4 x, float _permuteVal){
		return mod(((x*34.0)+1.0)*x, _permuteVal);
	}

	///noise stuff
	vec4 taylorInvSqrt(vec4 r){
		return 1.79284291400159 - 0.85373472095314 * r;
	}

	///more noise stuff
	float snoise(vec3 v, float _permuteVal){ 
		const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
		const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

		// First corner
		vec3 i  = floor(v + dot(v, C.yyy) );
		vec3 x0 =   v - i + dot(i, C.xxx) ;

		// Other corners
		vec3 g = step(x0.yzx, x0.xyz);
		vec3 l = 1.0 - g;
		vec3 i1 = min( g.xyz, l.zxy );
		vec3 i2 = max( g.xyz, l.zxy );

		//  x0 = x0 - 0. + 0.0 * C 
		vec3 x1 = x0 - i1 + 1.0 * C.xxx;
		vec3 x2 = x0 - i2 + 2.0 * C.xxx;
		vec3 x3 = x0 - 1. + 3.0 * C.xxx;

		// Permutations
		i = mod(i, 289.0 ); 
		vec4 p = permute( permute( permute( 
		i.z + vec4(0.0, i1.z, i2.z, 1.0 ) , _permuteVal)
		+ i.y + vec4(0.0, i1.y, i2.y, 1.0 ), _permuteVal) 
		+ i.x + vec4(0.0, i1.x, i2.x, 1.0 ), _permuteVal);

		// Gradients
		// ( N*N points uniformly over a square, mapped onto an octahedron.)
		float n_ = 1.0/7.0; // N=7
		vec3  ns = n_ * D.wyz - D.xzx;

		vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

		vec4 x_ = floor(j * ns.z);
		vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

		vec4 x = x_ *ns.x + ns.yyyy;
		vec4 y = y_ *ns.x + ns.yyyy;
		vec4 h = 1.0 - abs(x) - abs(y);

		vec4 b0 = vec4( x.xy, y.xy );
		vec4 b1 = vec4( x.zw, y.zw );

		vec4 s0 = floor(b0)*2.0 + 1.0;
		vec4 s1 = floor(b1)*2.0 + 1.0;
		vec4 sh = -step(h, vec4(0.0));

		vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
		vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

		vec3 p0 = vec3(a0.xy,h.x);
		vec3 p1 = vec3(a0.zw,h.y);
		vec3 p2 = vec3(a1.xy,h.z);
		vec3 p3 = vec3(a1.zw,h.w);

		//Normalise gradients
		vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
		p0 *= norm.x;
		p1 *= norm.y;
		p2 *= norm.z;
		p3 *= norm.w;

		// Mix final noise value
		vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
		m = m * m;
		return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
		dot(p2,x2), dot(p3,x3) ) );
	}

	float fbm( vec3 p, float _permuteVal) {
		float f = 0.0;
		f += 0.5000*snoise( p , _permuteVal); p = p*2.02;
		f += 0.2500*snoise( p , _permuteVal); p = p*2.03;
		f += 0.1250*snoise( p , _permuteVal); p = p*2.01;
		f += 0.0625*snoise( p , _permuteVal);
		return f/0.9375;
	}



	float shader01(vec2 _unitCoord, vec2 _multCoord, vec2 _multFractCoord, float _guiInput1){
		float _sum;

		float ramp = distance(_unitCoord, vec2(0.5, 0.5));

		vec2 center = vec2(0.0, 0.0);

		float distanceMultiplier = 1.0/distance(vec2(0.5, 0.5), vec2(0.0,0.0));

		vec2 pixellate = vec2( floor(_unitCoord.x * modRes.x) / modRes.x,
		floor(_unitCoord.y * modRes.y) / modRes.y) ;

		//a way to interpret time.x from a fraction to discrete options
		//float t = time.x * 0.001;

		_multFractCoord -= vec2(0.5);

		_multFractCoord = rotate2d( 0.25*PI ) * _multFractCoord;

		float dist = distance(_multFractCoord, center);
		float distPixellate = fract(distance(pixellate, vec2(0.5, 0.5))*distanceMultiplier-(time.x*beatMultiplier));

		distPixellate *= 1.2;

		if(distPixellate > 1.0){

			distPixellate = map(distPixellate, 1.0, 1.1, 1.0, 0.0);

		}

		float rand = distPixellate*random(pixellate)*0.25-0.2;

		if(dist < _guiInput1){
			_sum += 1.0-smoothstep(rand, rand+ 0.25, abs(_multFractCoord.x));
			_sum += 1.0-smoothstep(rand, rand+ 0.25, abs(_multFractCoord.y));
			_sum -= smoothstep(0.4, 0.5, dist);
		}

		ramp = smoothstep(0.5, 0.3, ramp);

		_sum *= ramp;

		return _sum;

	}

	float shader02(vec2 _unitCoord, vec2 _multCoord, vec2 _multFractCoord, float _guiInput1){

		float _sum;
		float timeMult = beatMultiplier*time.x;
		vec2 movRate = vec2(fract(timeMult), fract(timeMult*5.0));

		float timeStep;

		if(fract(timeMult) > 0.2){

			timeStep = floor(timeMult)/2000.0;

		} else{

			timeStep = floor(timeMult*1000.0)/200.0;

		}

		vec2 center = vec2(0.5, 0.5);

		vec2 pixellate = vec2( floor(_unitCoord.x * modRes.x) / modRes.x, 0.0) ;
		float dist = distance(pixellate, center)*2.0;

		float t = 1.4-(fract(random(pixellate+timeStep)*0.9 ));

		float yy = fract(_multCoord.y+movRate.y)*2.0;
		float xx = fract(_multCoord.x+movRate.x)*2.0;

		float rand = random(pixellate)*_guiInput1 + 0.75;

		if(yy > 1.0){
			yy = map(yy, 1.0, 2.0, 1.0, 0.0);
		}

		if(xx > 1.0){
			xx = map(xx, 1.0, 2.0, 1.0, 0.0);
		}

		_sum = smoothstep(t-0.1, t+0.1, yy );

		return _sum;


	}

	float shaderMulti(vec2 _unitCoord, vec2 _multCoord, vec2 _multFractCoord, float _guiInput1, float _permuteVal, float _t1M, float _t2M, float _n1S, float _n2S, int _ramp){


		//this will later become presets, right now its just a way for me to remember how to initialize it
		int rampCase = _ramp;

		float timeMult = beatMultiplier*time.x;

		int selectedPreset = int(mod(timeMult, 5.0));

		float permuteVal   = _permuteVal;
		float time1Mult    = _t1M;
		float time2Mult    = _t2M;
		float noise1Scale  = _n1S;
		float noise2Scale  = _n2S;

		float stepVal 	   = _guiInput1;

		float _sum;

		float ramp;

		float noise = 0.55 + fbm(vec3( _unitCoord * noise1Scale, timeMult *time1Mult), permuteVal);
		noise *= 0.25 + snoise(vec3(_unitCoord * noise2Scale + 1.5, timeMult*time2Mult), permuteVal);

		vec2 position = vec2(fract(_unitCoord.x*modRes.x),
		fract(_unitCoord.y*modRes.y));

		float l = length(position-center);

		if (rampCase == 0) {

			ramp = clamp(fract(_unitCoord.y-timeMult)-0.5, -0.1, 1.0);
			_sum = ramp*noise;
		}
		else if(rampCase == 1){
			ramp = clamp(fract(_unitCoord.x-timeMult)-0.5, -0.1, 1.0);
			_sum = ramp*noise;
		}
		else if(rampCase == 2){
			_sum = noise;
		}
		else if(rampCase == 3){
			ramp = clamp(fract(_unitCoord.x - timeMult) - 0.5, -0.1, 1.0);
			ramp = 1.0 - smoothstep(ramp, ramp + 0.2, l);
			_sum = ramp*noise;

		}

		_sum = smoothstep(stepVal, 1.0, _sum);


		return _sum;


	}


	void main(){

		vUvCd = uv;

		vec2 unitCoord		= vUvCd;
		vec2 multCoord 		= unitCoord * modRes;
		vec2 multFractCoord = fract(multCoord);

		float sum;
		int option = int(guiInput2);

		if(option == 0) {
			sum = shader01(unitCoord, multCoord, multFractCoord, guiInput1);
		} else if( option == 1){
			sum = shader02(unitCoord, multCoord, multFractCoord, guiInput1);
		} else if( option == 2){
			sum = shaderMulti(unitCoord, multCoord, multFractCoord, guiInput1, 9.0, 0.1, 0.2, 120.0, 1.0, 2);
		} else if( option == 3){
			sum = shaderMulti(unitCoord, multCoord, multFractCoord, guiInput1, 100.0, 0.0, 0.0, 1000.0, 100.0, 3);
		} else if( option == 4){
			sum = shaderMulti(unitCoord, multCoord, multFractCoord, guiInput1, 200.0, 3.0, 500.0, 500.0, 300.0, 0);
		} else if( option == 5){
			sum = shaderMulti(unitCoord, multCoord, multFractCoord, guiInput1, 4500.0, 10.0, 5.0, 150.0, 0.1, 2);
		}


		height = sum;

		vec3 pos = position + vec3(0,0,sum*depthInfluence);

		vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
		gl_Position = projectionMatrix * modelViewPosition;

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
	uniform float beatMultiplier;
	
	varying vec2 vUvCd;
	varying vec2 vUvAlpha;

	varying float height;

	void main()
	{

		vec4 color03  = vec4(0.0, 0.0, 0.0, 1.0);
		vec4 color02  = vec4(0.5, 0.5, 0.8, 1.0);
		vec4 color01  = vec4(1.0, 1.0, 1.0, 1.0);

		vec4 colorFinal;

		if(height < 0.5){
			colorFinal = mix(color01, color02, height*2.0);
		} else{

			colorFinal = mix(color02, color03, height*2.0-1.0);
		}

		gl_FragColor = colorFinal;

	}


	`;
	return ret;
}





///////////////////////////////////////////////////
// -- ADD SOME CUSTOM OPTIONS TO THE PULL DOWN - //
///////////////////////////////////////////////////
// Extra options in the pull down
var packedTextureMaterial;
var coreTextureMaterial;

function addControlOptions(){
	datGuiParms.rotationX=-90;
	datGui.add(datGuiParms,'rotationX').name("Floor Rotation").min(-90).max(90).step(1).onChange(function(val){
		geoList['videoPlane'].rotation.x = degToRad(val);
	});

	datGuiParms.depthInfluence1=0;
	datGui.add(datGuiParms,'depthInfluence1').name("Floor Depth").min(0).max(50).step(.1).onChange(function(val){
		packedTextureMaterial.uniforms.depthInfluence.value = Number( val );
	});
	
	datGuiParms.guiInput2=4;
	datGui.add(datGuiParms,'guiInput2').name("Floor Index").min(0).max(10).step(1).onChange(function(val){
		packedTextureMaterial.uniforms.guiInput2.value = Number( val );
	});

	datGuiParms.guiInput1=0.01;
	datGui.add(datGuiParms,'guiInput1').name("Floor Step").min(0.0).max(0.7).step(0.01).onChange(function(val){
		packedTextureMaterial.uniforms.guiInput1.value = Number( val );
	});

	datGuiParms.depthInfluence2=0;
	datGui.add(datGuiParms,'depthInfluence2').name("Planet Depth").min(0).max(50).step(.1).onChange(function(val){
		coreTextureMaterial.uniforms.depthInfluence.value = Number( val );
	});
	
	datGuiParms.guiInput4=1;
	datGui.add(datGuiParms,'guiInput4').name("Planet Index").min(0).max(10).step(1).onChange(function(val){
		coreTextureMaterial.uniforms.guiInput2.value = Number( val );
	});

	datGuiParms.guiInput3=0.3;
	datGui.add(datGuiParms,'guiInput3').name("Planet Step").min(0.0).max(0.7).step(0.01).onChange(function(val){
		coreTextureMaterial.uniforms.guiInput1.value = Number( val );
	});
	
	datGuiParms.beatMultiplier=1;
	datGui.add(datGuiParms,'beatMultiplier').name("Beat Multiplier").min(0).max(3).step(0.01).onChange(function(val){
		packedTextureMaterial.uniforms.beatMultiplier.value = Number( val );
	});
}

// Use the video as an input texture for a shader
function createVideoTextureObject(){

	coreTextureMaterial = new THREE.ShaderMaterial({
		uniforms:{
			// This is a THREE.Vector2, it automatically updates when msRunner.x is set
			time:{ value:msRunner }, 
			
			// Menu options from the pulldown
			depthInfluence: { type:"f", value: 0 },
			guiInput1: { type:"f", value: datGuiParms.guiInput3 },
			guiInput2: { type:"f", value: datGuiParms.guiInput4 },
			beatMultiplier: { type:"f", value: datGuiParms.beatMultiplier }
		},
		
		// Your vert shader above
		vertexShader:packedTextureVert(),
		
		// Your frag shader above
		fragmentShader:packedTextureFrag(),
		
		// Extra THREE.Material options --
		transparent:true,
		side:THREE.DoubleSide
	});

	packedTextureMaterial=new THREE.ShaderMaterial({
		uniforms:{
			// This is a THREE.Vector2, it automatically updates when msRunner.x is set
			time:{ value:msRunner }, 
			
			// Menu options from the pulldown
			depthInfluence: { type:"f", value: datGuiParms.depthInfluence2 },
			guiInput1: { type:"f", value: datGuiParms.guiInput1 },
			guiInput2: { type:"f", value: datGuiParms.guiInput2 },
			beatMultiplier: { type:"f", value: datGuiParms.beatMultiplier }
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
	videoPlaneMesh.position.set(0, -1,-1100);
	videoPlaneMesh.rotation.x=degToRad(-90);
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
	mapScene.background = new THREE.Color(1,1,1);
	
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

	//var perspectiveGeo = map_loadSceneFBX("perspectiveGeo05.fbx", null,'p01',mapScene);
	//map_loadSceneFBX(objPath, applyShader=null,meshKey,addToScene){

	// When the video object loads, set the videoTexture mesh object's height and width
	inputVideo=document.getElementById("inputVideo");
	inputVideo.onloadedmetadata=(e)=>{
		let ratio=inputVideo.videoHeight/inputVideo.videoWidth;
		let maxWidth=2000;
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

	var coreGeo = new THREE.SphereBufferGeometry(2000, 64, 128);
	var coreMesh = new THREE.Mesh( coreGeo, coreTextureMaterial );

	coreMesh.rotation.set( 0.2,0,0.4);
	coreMesh.position.set(0, 2300,-1400);
	mapScene.add( coreMesh );
	geoList['planet']=coreMesh;



	///////// to do: new instanced geometry and projected texture for intro




	//mapCam intro projection

	var introTexture = new THREE.TextureLoader().load( "antibodyIntro.png" );
	introTexture.format = THREE.RGBFormat;

	const elements = new THREE.Group();
	const perspectiveInstances = 70;
	for (let i = 0; i < perspectiveInstances; i++){
		const geometry = new THREE.IcosahedronGeometry(Math.random()*10+2);
		const element = new THREE.Mesh(geometry, coreTextureMaterial);
		if (i < perspectiveInstances * 0.4) {
			element.position.x = Math.random()*100-50;
			element.position.y = Math.random()*50-15;
			element.position.z = Math.random()*-20-20;
			element.scale.multiplyScalar(1.4);
		} else {
			element.position.x = Math.random()*150-75;
			element.position.y = Math.random()*60-20;
			element.position.z = Math.random()*-50-80;
		}

		element.rotation.x = Math.random()*Math.PI * 2;
		element.rotation.y = Math.random()*Math.PI * 2;
		element.rotation.z = Math.random()*Math.PI * 2;

		elements.add(element);
	}

	mapScene.add( elements );

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

function rotatePlanet(){

	geoList['planet'].rotateY( msRunner.x*0.001);

}

