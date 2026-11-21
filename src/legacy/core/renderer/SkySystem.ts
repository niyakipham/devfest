/**
 * Sky & Lighting System
 * Dynamic day/night cycle with stylized colors
 */

import * as THREE from 'three'

export interface SkyState {
  timeOfDay: number // 0-24 hours
  sunPosition: THREE.Vector3
  sunColor: THREE.Color
  ambientIntensity: number
  fogColor: THREE.Color
  fogDensity: number
}

export class SkySystem {
  private sun: THREE.DirectionalLight
  private ambient: THREE.AmbientLight
  private hemi: THREE.HemisphereLight
  private skyMesh: THREE.Mesh
  private state: SkyState
  
  constructor() {
    this.sun = new THREE.DirectionalLight(0xffffff, 1)
    this.sun.position.set(50, 100, 50)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.width = 2048
    this.sun.shadow.mapSize.height = 2048
    this.sun.shadow.camera.near = 0.5
    this.sun.shadow.camera.far = 500
    this.sun.shadow.camera.left = -150
    this.sun.shadow.camera.right = 150
    this.sun.shadow.camera.top = 150
    this.sun.shadow.camera.bottom = -150
    
    this.ambient = new THREE.AmbientLight(0xffffff, 0.4)
    this.hemi = new THREE.HemisphereLight(0x87ceeb, 0x4caf50, 0.3)
    
    // Sky dome
    const skyGeo = new THREE.SphereGeometry(400, 32, 15)
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x87CEEB) },
        bottomColor: { value: new THREE.Color(0xE0F7FF) },
        offset: { value: 20 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    })
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat)
    
    this.state = {
      timeOfDay: 6,
      sunPosition: new THREE.Vector3(),
      sunColor: new THREE.Color(),
      ambientIntensity: 0.4,
      fogColor: new THREE.Color(0xE0F7FF),
      fogDensity: 0.002
    }
  }
  
  update(dt: number, gameHour: number): void {
    this.state.timeOfDay = gameHour
    
    const sunAngle = ((gameHour - 6) / 12) * Math.PI // Sun rises at 6, sets at 18
    const sunHeight = Math.sin(sunAngle)
    const sunX = Math.cos(sunAngle) * 100
    
    this.sun.position.set(sunX, Math.max(sunHeight * 100, 10), 50)
    
    // Dynamic sun color
    if (gameHour < 7 || gameHour > 17) {
      // Golden hour / sunset
      this.sun.color.setHex(0xFF9800)
      this.sun.intensity = 0.8
    } else if (gameHour > 20 || gameHour < 5) {
      // Night
      this.sun.color.setHex(0x4A6FA5)
      this.sun.intensity = 0.2
    } else {
      // Day
      this.sun.color.setHex(0xFFEB3B)
      this.sun.intensity = 1.2
    }
    
    // Ambient light
    if (gameHour > 20 || gameHour < 5) {
      this.ambient.intensity = 0.1
      this.ambient.color.setHex(0x1A237E)
      this.hemi.color.setHex(0x1A237E)
      this.hemi.groundColor.setHex(0x000000)
      this.state.fogColor.setHex(0x0D1B2A)
    } else if (gameHour < 7 || gameHour > 17) {
      this.ambient.intensity = 0.5
      this.ambient.color.setHex(0xFF9800)
      this.hemi.color.setHex(0xFF9800)
      this.hemi.groundColor.setHex(0x4CAF50)
      this.state.fogColor.setHex(0xFFCC80)
    } else {
      this.ambient.intensity = 0.6
      this.ambient.color.setHex(0xffffff)
      this.hemi.color.setHex(0x87CEEB)
      this.hemi.groundColor.setHex(0x4CAF50)
      this.state.fogColor.setHex(0xE0F7FF)
    }
    
    // Update sky shader colors
    const skyMat = this.skyMesh.material as THREE.ShaderMaterial
    if (gameHour > 20 || gameHour < 5) {
      skyMat.uniforms.topColor.value.setHex(0x0D1B2A)
      skyMat.uniforms.bottomColor.value.setHex(0x1A237E)
    } else if (gameHour < 7 || gameHour > 17) {
      skyMat.uniforms.topColor.value.setHex(0xFF7043)
      skyMat.uniforms.bottomColor.value.setHex(0xFFCC80)
    } else {
      skyMat.uniforms.topColor.value.setHex(0x87CEEB)
      skyMat.uniforms.bottomColor.value.setHex(0xE0F7FF)
    }
  }
  
  getSun(): THREE.DirectionalLight { return this.sun }
  getAmbient(): THREE.AmbientLight { return this.ambient }
  getHemi(): THREE.HemisphereLight { return this.hemi }
  getSkyMesh(): THREE.Mesh { return this.skyMesh }
  getState(): SkyState { return this.state }
}
