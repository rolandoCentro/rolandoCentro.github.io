
// Apparently traversing this file breaks when there are no children on leafs
//   Oh well... Just get it done
function map_loadSceneFBX(objPath, applyShader=null,meshKey,addToScene){
	if(meshKey!=''){ // Prep for IsLoaded checks
		geoLoadListComplete=0;
		geoLoadList[meshKey]=0;
	}
	let addedGlow=0;
	
	var fbxLoader=new THREE.FBXLoader();
	fbxLoader.load( objPath, function(curFbx){
			if(applyShader==null){
				addToScene.add(curFbx);
			}else{
				if(c.isMesh){
					c.material=applyShader;
					addToScene.add(c);
				}
			}
		}, undefined, function(err){
			console.log(err);
			if(meshKey!=''){
				geoLoadList[meshKey]=1;
			}
		});
	return fbxLoader;
}



function mapShaderBuilder(mesh,vertShader,fragShader,customUniforms=null){
	var mat;
	var curMS=Date.now();
	var uniforms={
		diffuse:{type:"t",value:null},
		time:{ value:msRunner }
	};
	if(customUniforms!=null){
		uniforms=Object.assign({},uniforms,customUniforms);
	}
	
	mat=new THREE.ShaderMaterial({
		uniforms:uniforms,
		vertexShader:eval(vertShader+"()"),
		fragmentShader:eval(fragShader+"()")
	});
	mat.transparent=true;
	mat.depthTest=true;
	
	return mat;
}

function map_applyTransformList(curObj,transList){
	var rotate=transList["r"];
	curObj.rotateX(rotate[0]);
	curObj.rotateY(rotate[1]);
	curObj.rotateZ(rotate[2]);
	if(typeof(transList["rOrder"]) !== "undefined" ){
		curObj.rotation.order=transList["rOrder"];
	}
	var pos=transList["t"];
	curObj.position.set(pos[0],pos[1],pos[2]);
	var scale=transList["s"];
	curObj.scale.set(scale[0],scale[1],scale[2]);
	
	curObj.matrixAutoUpdate=false;
	curObj.updateMatrix();
}
function map_loadTexture(imgPath, verboseLoading,mods={}){
	// Reuse textures?
	// Eh, seems to work
	if(typeof(textLoaderArray[imgPath]) != "undefined"){
		texture=textLoaderArray[imgPath];
	}else{
		//var texLoader=new THREE.ImageLoader(verboseLoading);
		var texture=new THREE.Texture();
		texLoader.load(imgPath,
			function(tex){
				texture.image=tex;
				texture.needsUpdate=true;
				texture.encoding=THREE.sRGBEncoding;
				texture.mapping = THREE.CubeUVRefractionMapping;
				if(mods.length>0){
					let keys=Object.keys(mods);
					keys.forEach((x)=>{
						texture[x]=mods[x];
					});
				}
			}
		);
		textLoaderArray[imgPath]=texture;
	}
	return texture;
}


////////////////////////////////////////////////////


////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////

function mapRender(){
	
	mapFpsQualitCheck();
	
	if(directionKeyDown){
		camMove(prevMS);
	}
	if(cameraJumpInAir){
		camJump(prevMS);
	}
	
	mapUpdateCamera();

	
	mapEngine.render( mapScene, mapCam);
	
	if(fpsStats!=-1){
		fpsStats.update();
	}
		
	objsBooted=1;
	
	if(mapPause == 0){
		requestAnimationFrame(mapRender);
	}
}