/**
 * WebGL Renderer with Toon Shading
 * Handles 3D scene rendering with stylized cartoon graphics
 */

import * as THREE from 'three'

export class Renderer {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private toonMaterials: Map<string, THREE.MeshToonMaterial>
  
  constructor() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false 
    })
    
    this.toonMaterials = new Map()
    
    this.camera.position.set(0, 5, 10)
    this.camera.lookAt(0, 0, 0)
  }
  
  async initialize(): Promise<void> {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    
    document.body.appendChild(this.renderer.domElement)
    
    this.setupLighting()
    this.setupPostProcessing()
    
    window.addEventListener('resize', this.handleResize)
    
    console.log('[Renderer] Initialized')
  }
  
  private setupLighting(): void {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(ambientLight)
    
    // Main directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffeb3b, 1.2)
    sunLight.position.set(50, 100, 50)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 500
    sunLight.shadow.camera.left = -100
    sunLight.shadow.camera.right = 100
    sunLight.shadow.camera.top = 100
    sunLight.shadow.camera.bottom = -100
    this.scene.add(sunLight)
    
    // Hemisphere light for sky/ground color bleeding
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x4caf50, 0.3)
    this.scene.add(hemiLight)
  }
  
  private setupPostProcessing(): void {
    // Post-processing will be added later for bloom, color grading
    console.log('[Renderer] Post-processing setup ready')
  }
  
  render(): void {
    this.renderer.render(this.scene, this.camera)
  }
  
  addMesh(mesh: THREE.Mesh): void {
    this.scene.add(mesh)
  }
  
  removeMesh(mesh: THREE.Mesh): void {
    this.scene.remove(mesh)
  }
  
  getScene(): THREE.Scene {
    return this.scene
  }
  
  getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }
  
  createToonMaterial(color: number, gradientMap?: THREE.Texture): THREE.MeshToonMaterial {
    const material = new THREE.MeshToonMaterial({
      color,
      gradientMap: gradientMap || this.createGradientMap()
    })
    
    const id = `toon_${Math.random().toString(36).substr(2, 9)}`
    this.toonMaterials.set(id, material)
    
    return material
  }
  
  private createGradientMap(): THREE.DataTexture {
    const colors = new Uint8Array([0, 128, 255])
    const texture = new THREE.DataTexture(colors, 3, 1, THREE.RedFormat)
    texture.needsUpdate = true
    return texture
  }
  
  private handleResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }
  
  dispose(): void {
    window.removeEventListener('resize', this.handleResize)
    this.renderer.dispose()
    
    this.toonMaterials.forEach(material => material.dispose())
    this.toonMaterials.clear()
    
    console.log('[Renderer] Disposed')
  }
}
