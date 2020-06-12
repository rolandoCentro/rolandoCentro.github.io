class ProjectedMaterial extends THREE.ShaderMaterial {
  constructor({ camera, texture, offset, aspect, ...options } = {}) {
    if (!texture || !texture.isTexture) {
      throw new Error('Invalid texture passed to the ProjectedMaterial')
    }

    if (!camera || !camera.isCamera) {
      throw new Error('Invalid camera passed to the ProjectedMaterial')
    }

    // make sure the camera matrices are updated
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()
    camera.updateWorldMatrix()

    // get the matrices from the camera so they're fixed in camera's original position
    const viewMatrixCamera = camera.matrixWorldInverse.clone()
    const projectionMatrixCamera = camera.projectionMatrix.clone()
    const modelMatrixCamera = camera.matrixWorld.clone()

    const projPosition = camera.position.clone()

    super({
      ...options,
      uniforms: {
        time:{ value:msRunner }, 
        offset: { value: offset },
        texture: { value: texture },
        aspect: { value : aspect},
        viewMatrixCamera: { type: 'm4', value: viewMatrixCamera },
        projectionMatrixCamera: { type: 'm4', value: projectionMatrixCamera },
        modelMatrixCamera: { type: 'mat4', value: modelMatrixCamera },
        savedModelMatrix: { type: 'mat4', value: new THREE.Matrix4() },
        projPosition: { type: 'v3', value: projPosition },
      },

      vertexShader: `
      uniform mat4 savedModelMatrix;
      uniform mat4 viewMatrixCamera;
      uniform mat4 projectionMatrixCamera;
      uniform mat4 modelMatrixCamera;

      varying vec4 vWorldPosition;
      varying vec3 vNormal;
      varying vec4 vTexCoords;


      void main() {
        vNormal = mat3(savedModelMatrix) * normal;
        vWorldPosition = savedModelMatrix * vec4(position, 1.0);
        vTexCoords = projectionMatrixCamera * viewMatrixCamera * vWorldPosition;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
      `,

      fragmentShader: `
      uniform vec3 offset;
      uniform sampler2D texture;
      uniform vec3 projPosition;
      uniform float aspect;
      uniform vec2 time;

      varying vec3 vNormal;
      varying vec4 vWorldPosition;
      varying vec4 vTexCoords;

      vec3 color2;

      float random (in vec2 _st) {
        return fract(sin(dot(_st.xy,
        vec2(12.9898,78.233)))*
        43758.5453123);
      }

      void main() {
        vec2 uv = (vTexCoords.xy / vTexCoords.w) * 0.5 + 0.5;

        if(aspect > 1.0){
          uv.x = (aspect - 1.0) * -0.5 + uv.x * aspect;
          uv.y = 1.0 - uv.y;
        } else {

          uv.y = (1.0 / aspect - 1.0) * -0.5 + (1.0 - uv.y) / aspect;

        }
        color2 = vec3(random(time.xy+offset.xy),random(time.xy+offset.xy+vec2(2,2)),random(time.xy+offset.xy+vec2(5,5)));

        vec4 outColor = texture2D(texture, uv);

        // this makes sure we don't render also the back of the object
        vec3 projectorDirection = normalize(projPosition - vWorldPosition.xyz);
        float dotProduct = dot(vNormal, projectorDirection);
        if (dotProduct < 0.0) {
          outColor = vec4(color2, 1.0);
        }

        //outColor = vec4(uv.x, uv.y, 0.0, 1.0);

        gl_FragColor = outColor;
      }
      `,
    })

    this.isProjectedMaterial = true
  }
}

function project(mesh) {
  if (!mesh.material.isProjectedMaterial) {
    throw new Error(`The mesh material must be a ProjectedMaterial`)
  }

  // make sure the matrix is updated
  mesh.updateMatrixWorld()

  // we save the object model matrix so it's projected relative
  // to that position, like a snapshot
  mesh.material.uniforms.savedModelMatrix.value.copy(mesh.matrixWorld)
}
