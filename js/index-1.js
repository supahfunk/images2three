import '/scss/style-1.scss'
import * as THREE from 'three'
import * as noiseImage from '/img/noise.png'
import LocomotiveScroll from 'locomotive-scroll'

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

    this.scroll = {
      y: 0,
      oldY: 0,
      speed: 0,
    }
    this.mouse = {
      x: 0,
      y: 0,
      speed: 0
    }
    this.time = null

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
          this.createMaterial()
          this.images.forEach((i, index) => {
            this.createMesh(i)
          })
          this.render()
        }
      })
      img.src = i.src
    })
  }


  /*------------------------------
  Create Material
  ------------------------------*/
  createMaterial() {
    this.geometry = new THREE.PlaneBufferGeometry(1, 1, 120, 120)
    this.geometry.verticesNeedUpdate = true

    this.vertShader = document.getElementById('vertexShader').innerHTML
    this.fragShader = document.getElementById('fragmentShader').innerHTML

    this.textureNoise = new THREE.TextureLoader().load( noiseImage.default )
    this.textureNoise.magFilter = THREE.NearestFilter
    this.textureNoise.minFilter = THREE.LinearFilter
    this.textureNoise.wrapS = this.textureNoise.wrapT = THREE.RepeatWrapping
  }
  
  
  /*------------------------------
  Create Mesh
  ------------------------------*/
  createMesh(i) {
    const textureImage = new THREE.TextureLoader().load( i.src )
    textureImage.magFilter = THREE.NearestFilter
    textureImage.minFilter = THREE.LinearFilter
    // textureImage.wrapS = textureImage.wrapT = THREE.RepeatWrapping

    const material = new THREE.ShaderMaterial({
      vertexShader: this.vertShader,
      fragmentShader: this.fragShader,
      uniforms: {
        uImage: {
          type: "t",
          value: textureImage
        },
        uNoise: {
          type: "t",
          value: this.textureNoise
        },
        uTime: {
          type: "f",
          value: performance.now()
        },
        uSpeed: {
          type: "f",
          value: this.scroll.speed
        },
        uRandom: {
          type: "f",
          value: -100 + Math.random() * 100
        },
        uResolution : {
          type : "v2",
          value : new THREE.Vector2(window.innerWidth, window.innerHeight)
              .multiplyScalar(window.devicePixelRatio)
        },
        uMouse : {
          type : "v2",
          value : new THREE.Vector2(0.7 * window.innerWidth, window.innerHeight)
              .multiplyScalar(window.devicePixelRatio)
        }
      },
      side: THREE.DoubleSide,
    })

    const mesh = new THREE.Mesh(this.geometry, material)
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
    this.time = performance.now()

    // Scroll
    this.scroll.y = scroll.scroll.instance.scroll.y
    this.scroll.speed = (this.scroll.y - this.scroll.oldY) * 0.09
    this.scene.position.y = this.scroll.y * this.viewSize.height / this.opt.height
    this.scroll.oldY = this.scroll.y

    // Uniform
    this.meshes.forEach((i, index) => {
      i.mesh.material.uniforms.uTime.value = this.time
      i.mesh.material.uniforms.uSpeed.value = this.scroll.speed
    })

    // Render Scene
    this.renderer.render(this.scene, this.camera)

    window.requestAnimationFrame(this.render.bind(this))
  }
  
  
  /*------------------------------
  Events
  ------------------------------*/
  events() {
    window.addEventListener('resize', this.resizeCanvas.bind(this))
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
const scroll = new LocomotiveScroll({
  el: document.querySelector('#app'),
  smooth: true,
});
const fx = new Dom2webgl({
  canvas: document.querySelector('#canvas'),
  images: document.querySelectorAll('.image-fx'),
  loader: document.querySelector('#loading'),
})
document.documentElement.style.setProperty('--vh', `${window.innerHeight / 100}px`)
window.addEventListener('load', () => {
  window.dispatchEvent(new Event('resize'))
})