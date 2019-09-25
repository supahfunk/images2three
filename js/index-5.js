import * as THREE from 'three'
import createjs from 'preload-js'
import LocomotiveScroll from 'locomotive-scroll'
import '/scss/style-5.scss'

console.clear()


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
  createScene() {
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
  resizeCanvas() {
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
  loadAllImages() {
    const queue = new createjs.LoadQueue(false)
    const assets = []
    queue.on('complete', () => {
      this.loader.style.opacity = 0
      this.canvas.style.opacity = 1
      this.images.forEach(i => {
        this.createMaterial()
        this.createMesh(i)
      })
      this.createText()
      this.render()
    })

    this.images.forEach((i, index) => {
      const tag = i.tagName.toLowerCase()
      const src = tag === 'img' ? i.src : i.querySelectorAll('source')[0].src
      const type = tag === 'img' ? createjs.AbstractLoader.IMAGE : createjs.AbstractLoader.BINARY

      assets.push({
        id: index,
        src: src,
        type: type
      })
    })

    queue.loadManifest(assets)
    queue.on('progress', e => {
      this.loader.style.width = `${queue.progress * 200}px`
    })
  }


  /*------------------------------
  Create Material
  ------------------------------*/
  createMaterial() {
    this.geometry = new THREE.PlaneBufferGeometry(1, 1, 30, 4)
    this.geometry.verticesNeedUpdate = true

    this.vertShader = document.getElementById('vertexShader').innerHTML
    this.fragShader = document.getElementById('fragmentShader').innerHTML
  }


  /*------------------------------
  Create Mesh
  ------------------------------*/
  createMesh(i) {
    const type = i.tagName.toLowerCase()
    let textureImage = new THREE.TextureLoader().load(i.src)

    if (type === 'img') {
      textureImage = new THREE.TextureLoader().load(i.src)
    } else if (type === 'video') {
      textureImage = new THREE.VideoTexture(i)
    } else {
      textureImage = new THREE.CanvasTexture(document.getElementById('canvas-0'))
    }
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
        uResolution: {
          type: "v2",
          value: new THREE.Vector2(this.opt.width, this.opt.height)
            .multiplyScalar(window.devicePixelRatio)
        },
        uMouse: {
          type: "v2",
          value: new THREE.Vector2(0.7 * this.opt.width, this.opt.height)
            .multiplyScalar(window.devicePixelRatio)
        }
      },
      side: THREE.DoubleSide,
      // wireframe: true,
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
    window.console.log('i ---->', i, mesh)
    const rect = i.getBoundingClientRect()
    const widthViewUnit = (rect.width * this.viewSize.width) / this.opt.width
    const heightViewUnit = (rect.height * this.viewSize.height) / this.opt.height

    // Se l'immagine/video è wrappato da div.video-wrap, l'offsetTop deve essere del parent
    let offsetLeft = i.offsetLeft
    let offsetTop = i.offsetTop

    if (i.parentElement.classList.contains('wrap-fx')) {
      offsetLeft = i.parentElement.offsetLeft + i.offsetLeft
      offsetTop = i.parentElement.offsetTop + i.offsetTop
    }
    
    const xViewUnit = (offsetLeft * this.viewSize.width) / this.opt.width - this.viewSize.width / 2
    const yViewUnit = (offsetTop * this.viewSize.height) / this.opt.height - this.viewSize.height / 2

    mesh.scale.x = widthViewUnit
    mesh.scale.y = heightViewUnit

    let x = xViewUnit + widthViewUnit / 2
    let y = -yViewUnit - heightViewUnit / 2

    mesh.position.x = x
    mesh.position.y = y
  }


  /*------------------------------
  Get Lines Canvas Text
  ------------------------------*/
  getLines(ctx, text, maxWidth) {
    const words = text.split(" ")
    const lines = []
    let currentLine = words[0]

    for (let i = 1; i < words.length; i++) {
        const word = words[i]
        const width = ctx.measureText(currentLine + " " + word).width
        if (width < maxWidth) {
            currentLine += " " + word
        } else {
            lines.push(currentLine)
            currentLine = word
        }
    }
    lines.push(currentLine)
    return lines
  }


  /*------------------------------
  createText
  ------------------------------*/
  createText() {
    const texts = document.querySelectorAll('.text-fx')
    texts.forEach((i, index) => {
      const canvasText = document.createElement('canvas')
      canvasText.id = `canvas-${index}`
      canvasText.classList.add('canvas')
      document.documentElement.appendChild(canvasText)
      
      const { width, height, color, fontSize, fontStyle, fontWeight, fontFamily, lineHeight, textAlign } = window.getComputedStyle(i)
      
      canvasText.style.height = height
      canvasText.style.width = width

      const scale = window.devicePixelRatio
      canvasText.width = parseInt(width, 10) * scale
      canvasText.height = parseInt(height, 10) * scale
      
      const ctx = canvasText.getContext("2d")
      ctx.scale(scale, scale)
     
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`
      ctx.fillStyle = color
      ctx.textAlign = textAlign
      let x = 0
      if (textAlign === 'center') {
        x = parseInt(width, 10) / 2
      } else if (textAlign === 'right') {
        x = parseInt(width, 10)
      }

      const lines = this.getLines(ctx, i.innerText, parseInt(width, 10))
      lines.forEach((l, i) => {
        ctx.fillText(l, x, parseInt(fontSize, 10) + (parseInt(lineHeight, 10) * i))
      })

      this.createMaterial()
      this.createMesh(i)
    })
  }


  /*------------------------------
  Percentage Seen
  ------------------------------*/
  percentageSeen(el) {
    const bounds = el.getBoundingClientRect()
    const top = bounds.top
    const height = bounds.height

    if (top > (this.scroll.y + this.opt.height)) {
      return 0;
    } else {
      const percentage = Math.max(0, this.opt.height - (this.opt.height - top) + height)
      return percentage
    }
  }


  /*------------------------------
  Render
  ------------------------------*/
  render() {
    this.time = performance.now()

    // Scroll
    this.scroll.y = scroll.scroll.instance.scroll.y
    this.scroll.speed = (this.scroll.y - this.scroll.oldY) * 0.02
    this.scene.position.y = this.scroll.y * this.viewSize.height / this.opt.height
    this.scroll.oldY = this.scroll.y

    // Uniform
    this.meshes.forEach((i) => {
      i.mesh.material.uniforms.uTime.value = this.time
      i.mesh.material.uniforms.uSpeed.value = this.scroll.speed
    })


    // this.meshes[6].mesh.rotation.y = this.scroll.y * 0.01
    
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