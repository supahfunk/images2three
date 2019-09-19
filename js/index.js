import '/scss/style.scss'
import * as THREE from 'three'

console.clear()

/*------------------------------
Range
------------------------------*/
const range = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2


/*------------------------------
IsInViewport
------------------------------*/
const isInViewport = (elem) => {
	const b = elem.getBoundingClientRect()
	return (
		b.top + b.height >= 0 &&
    b.bottom - b.height <= window.innerHeight
	)
}


/*------------------------------
Dom2Webgl
------------------------------*/
class Dom2webgl {
  constructor(options) {
    Object.assign(this, options)
    this.images = [...this.images]
    this.meshes = []
    this.opt = {
      width: window.innerWidth,
      height: window.innerHeight,
      aspect: window.innerWidth / window.innerHeight
    }

    this.scrollY = 0
    
    this.uniforms = {
      uImage: new THREE.Uniform(null),
      uImageRes: new THREE.Uniform(new THREE.Vector2(1, 1)),
      uViewSize: new THREE.Uniform(new THREE.Vector2(1, 1)),
    }
    
    this.initialize()
    this.events()
  }
  
  
  /*------------------------------
  Create Scene
  ------------------------------*/
  createScene(){
    this.scene = new THREE.Scene()
    this.scene.position.needsUpdate = true
    
    this.camera = new THREE.PerspectiveCamera(30, this.opt.aspect, 1, 10000)
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.opt.width, this.opt.height)
    this.camera.position.z = 180 / this.camera.aspect
    this.camera.lookAt = this.scene.position
    this.camera.target = new THREE.Vector3(0, 0, 0)
    this.viewSize = this.getViewSize()
   }
  
  
  /*------------------------------
  Get View Size
  ------------------------------*/
  getViewSize() {
    const fovInRadians = (this.camera.fov * Math.PI) / 180
    const height = Math.abs(
      this.camera.position.z * Math.tan(fovInRadians / 2) * 2
    )
    return { width: height * this.camera.aspect, height }
  }
  
  
  /*------------------------------
  Resize
  ------------------------------*/
  resizeCanvas(){
    // window.scrollTo(0, 0)
    this.opt.width = window.innerWidth
    this.opt.height = window.innerHeight
    
    this.opt.aspect = this.opt.width / this.opt.height
    this.camera.aspect = this.opt.aspect
    this.camera.updateProjectionMatrix()
    this.camera.position.z = 180 / this.camera.aspect
    
    this.viewSize = this.getViewSize()
    this.meshes.forEach(i => {
      this.resizeMesh(i.img, i.mesh)
    })
    
    this.renderer.setSize(this.opt.width, this.opt.height)
  }

  
  /*------------------------------
  Load All Images
  ------------------------------*/
  loadAllImages(){
    let loaded = 0
    this.images.forEach((i, index) => {
      const img = document.createElement('img')
      img.crossOrigin = "anonymous"
      img.onload = (() => {
        loaded++
        this.loader.style.width = `${loaded / this.images.length * 200}px`
        if (loaded === this.images.length) {
          this.loader.style.opacity = 0
          this.canvas.style.opacity = 1
          console.log('loaded')
          this.images.forEach((i, index) => {
            this.createMesh(i)
          })
          window.scrollTo(0, 0)
          this.render()
        }
      })
      img.src = i.src
    })
  }
  
  
  /*------------------------------
  Create Mesh
  ------------------------------*/
  createMesh(i) {
    var vertShader = document.getElementById('vertexShader').innerHTML
    var fragShader = document.getElementById('fragmentShader').innerHTML
    const texture = new THREE.TextureLoader().load( i.src )
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.LinearFilter
    const geometry = new THREE.PlaneBufferGeometry(1, 1, 8, 8)
    const material = new THREE.ShaderMaterial({
      vertexShader: vertShader,
      fragmentShader: fragShader,
      uniforms: {
        uImage: {
          type: "t",
          value: texture
        }
      },
      side: THREE.DoubleSide,
    })
    console.log('material', material)
    const mesh = new THREE.Mesh(geometry, material)
    geometry.verticesNeedUpdate = true
    this.meshes.push({
      img: i,
      mesh
    })
    this.resizeMesh(i, mesh)
    this.scene.add(mesh)
  }
  
  
  /*------------------------------
  Resize Mesh
  ------------------------------*/
  resizeMesh(i, mesh) {
    const rect = i.getBoundingClientRect()
    const widthViewUnit = (rect.width * this.viewSize.width) / this.opt.width
    const heightViewUnit = (rect.height * this.viewSize.height) / this.opt.height
    const xViewUnit = (i.offsetLeft * this.viewSize.width) / this.opt.width - this.viewSize.width / 2
    const yViewUnit = (i.offsetTop * this.viewSize.height) / this.opt.height - this.viewSize.height / 2

    mesh.scale.x = widthViewUnit
    mesh.scale.y = heightViewUnit

    let x = xViewUnit + widthViewUnit / 2
    let y = -yViewUnit - heightViewUnit / 2

    mesh.position.x = x
    mesh.position.y = y
  }

  
  /*------------------------------
  Render
  ------------------------------*/
  render() {
    window.requestAnimationFrame(this.render.bind(this))
    this.scene.position.y = this.scrollY * this.viewSize.height / this.opt.height
    
    this.scene.children.forEach((i, index) => {
      i.rotation.x = (this.scrollY + index * 40) * 0.003
    })
    this.renderer.render(this.scene, this.camera)
  }
  
  
  /*------------------------------
  Events
  ------------------------------*/
  events() {
    window.addEventListener('resize', this.resizeCanvas.bind(this))
    document.getElementById('app').addEventListener('scroll', () => {
      this.scrollY = document.getElementById('app').scrollTop
    })
  }
  
  
  /*------------------------------
  Initialize
  ------------------------------*/
  initialize() {
    this.createScene()
    this.loadAllImages()
  }
}


/*--------------------
Init
--------------------*/
const fx = new Dom2webgl({
  canvas: document.querySelector('#canvas'),
  images: document.querySelectorAll('.image-fx'),
  loader: document.querySelector('#loading'),
})
document.documentElement.style.setProperty('--vh', `${window.innerHeight / 100}px`)
window.addEventListener('load', () => {
  window.dispatchEvent(new Event('resize'))
})