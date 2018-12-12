;(function (window, factory) {
  
  factory((window.ImageBrowser = {}))
  
  ImageBrowser.init()

}(window, (function (exports) {

const ImageBrowser = function () {

  this.id = (new Date()).getTime()

  this.images = []

  this.current = 0

  this.show = false

  this._dom

  this.dom$imageName

  this.dom$page

  this.init()
}

ImageBrowser.prototype = {

  constructor: ImageBrowser,

  mount (dom) {
    dom.appendChild(this._dom)
    return this
  },
  
  showOnClick (dom) {
    if (dom == void 0) {
      return
    }

    const tagAList = dom.getElementsByTagName('a')
    
    const images = []
    for (let i = 0, link = tagAList[i]; link !== void 0; link = tagAList[++i]) {
      const url = link.getAttribute('href')
      const text = link.innerText
      link.setAttribute('href', 'javascript:void(0);')
      link.dataset.url = url
      link.dataset.index = i
      images.push({ url, text })
    }
    this.insertImages(images)
    this.images = images
    
    function clickHandler (e) {
      const event = e || window.event
      const target = event.target || event.srcElement
      if (target.nodeName.toLocaleLowerCase() !== 'a') {
        return
      }
      this.toggleClose()
      
      const current = +target.dataset.index
      this.current = current
      
      const loadIndex = [current - 1, current, current + 1]
      loadIndex.forEach(i => {
        const image = this.images[i]
        image && image.dom.setAttribute('src', image.url)
      })

      const imageSwiper = this._dom.getElementsByClassName('image-browser__image-swiper')[0]
      imageSwiper.scrollLeft = current * 600

      this.dom$imageName.innerText = this.images[current].text
      this.dom$page.innerText = `${current + 1}/${this.images.length}`

      if (current == 0) {
        const btn = this._dom.getElementsByClassName('image-browser__btn_arrow_back')[0]
        btn.classList.add('image-browser__btn_disable')
      }

      if (current == this.images.length - 1) {
        const btn = this._dom.getElementsByClassName('image-browser__btn_arrow_forward')[0]
        btn.classList.add('image-browser__btn_disable')
      }
    }

    dom.addEventListener('click', clickHandler.bind(this), false)
  },

  toggleClose () {
    const dom = this._dom
    if (this.show) {
      this.show = false
      const imageSwiper = dom.getElementsByClassName('image-browser__image-swiper')[0]
      imageSwiper.scrollLeft = 0
      const backBtn = dom.getElementsByClassName('image-browser__btn_arrow_back')[0]
      backBtn.classList.remove('image-browser__btn_disable')
      const forwardBtn = dom.getElementsByClassName('image-browser__btn_arrow_forward')[0]
      forwardBtn.classList.remove('image-browser__btn_disable')

      dom.classList.remove('image-browser__show')
      this.current = 0
    }
    else {
      this.show = true
      dom.classList.add('image-browser__show')
    }
  },

  lazyLoadImage (index) {
    const image = this.images[index]
    if (image == void 0) {
      return
    }
    const { url, dom } = image
    if (dom.getAttribute('src') !== null) {
      return
    }
    dom.setAttribute('src', url)
  },

  init () {
    const browserWrapper = this.create('div', 'image-browser')
    const toolbar = this.createToolbar()
    const imageNav = this.createImageNav()
    const footer = this.createFooter()
    browserWrapper.appendChild(toolbar)
    browserWrapper.appendChild(imageNav)
    browserWrapper.appendChild(footer)

    this._dom = browserWrapper

    this.mount(document.body)

    const ext = document.getElementsByClassName('ext')[0]
    this.showOnClick(ext)
  },

  create (tag, className) {
    const dom = document.createElement(tag)
    dom.className = className
    return dom
  },
  
  createToolbar () {
    const toolbar = this.create('div', 'image-browser__row image-browser__toolbar')

    const rotateLeftBtn = this.create('button', 'image-browser__btn image-browser__rotate-btn')
    rotateLeftBtn.appendChild(document.createTextNode('向左旋转'))

    const rotateRightBtn = this.create('button', 'image-browser__btn image-browser__rotate-btn')
    rotateRightBtn.appendChild(document.createTextNode('向右旋转'))

    const closeBtn = this.create('button', 'image-browser__btn image-browser__close-btn ion-ios-close-circle-outline')

    toolbar.appendChild(rotateLeftBtn)
    toolbar.appendChild(rotateRightBtn)
    toolbar.appendChild(closeBtn)

    rotateLeftBtn.onclick = function () { rotate(this.images[this.current].dom, -90) }.bind(this)

    rotateRightBtn.onclick = function () { rotate(this.images[this.current].dom, 90) }.bind(this)

    closeBtn.onclick = this.toggleClose.bind(this)

    return toolbar
  },

  createFooter () {
    const footer = this.create('div', 'image-browser__row image-browser__footer')

    const imageName = this.create('div', 'image-browser__image-name')
    imageName.innerText = '附件名称'
    this.dom$imageName = imageName

    const page = this.create('div', 'image-browser__page')
    page.innerText = '0/0'
    this.dom$page = page

    footer.appendChild(imageName)
    footer.appendChild(page)

    return footer
  },

  createImageNav () {
    const imageNav = this.create('div', 'image-browser__row image-browser__image-nav')

    const imageSwiper = this.create('div', 'image-browser__image-swiper')

    const createNavigatorBtn = arrow => {
      const btn = this.create('button', `image-browser__btn image-browser__btn_arrow_${arrow} ion-ios-arrow-${arrow}`)
      return btn
    }

    const backBtn = createNavigatorBtn('back')
    const forwardBtn = createNavigatorBtn('forward')

    imageNav.appendChild(backBtn)
    imageNav.appendChild(imageSwiper)
    imageNav.appendChild(forwardBtn)

    backBtn.onclick = () => {
      if (this.current == 0) {
        return
      }

      forwardBtn.classList.remove('image-browser__btn_disable')

      scroll({ dom: imageSwiper, offset: -600 })
      this.current = this.current - 1
      
      this.dom$imageName.innerText = this.images[this.current].text
      this.dom$page.innerText = `${this.current + 1}/${this.images.length}`
      
      this.lazyLoadImage(this.current - 1)

      this.current == 0 && backBtn.classList.add('image-browser__btn_disable')
    }
    
    forwardBtn.onclick = () => {
      const len = this.images.length
      if (this.current == len - 1) {
        return
      }

      backBtn.classList.remove('image-browser__btn_disable')

      scroll({ dom: imageSwiper, offset: 600 })
      this.current = this.current + 1
      
      this.dom$imageName.innerText = this.images[this.current].text
      this.dom$page.innerText = `${this.current + 1}/${len}`

      this.lazyLoadImage(this.current + 1)

      this.current == len - 1 && forwardBtn.classList.add('image-browser__btn_disable')
    }

    return imageNav
  },

  createImage ({ src, index }) {
    const image = this.create('img', 'image-browser__image')
    image.setAttribute('alt', src)
    image.style = '-webkit-transform:rotate(0);transform:rotate(0)'
    image.dataset.index = index

    return image
  },

  insertImages (images) {
    const imageSwiper = this._dom.getElementsByClassName('image-browser__image-swiper')[0]
    images.forEach((e, index) => {
      const image = this.createImage({ src: e.url, index })
      const imageWrapper = this.create('div', 'image-browser__image-wrapper')
      imageWrapper.style.left = `${index * 600}px`
  
      imageWrapper.appendChild(image)
      imageSwiper.appendChild(imageWrapper)
  
      e.dom = image
    })
  }
}

function rotate (dom, deg) {
  const matrix = window.getComputedStyle(dom, null).getPropertyValue('transform')
  const [a, b] = matrix.split('(')[1].split(')')[0].split(',')
  const _deg = Math.round(Math.atan2(b, a) * (180 / Math.PI))
  dom.style = `-webkit-transform:rotate(${_deg + deg}deg);transform:rotate(${_deg + deg}deg)`
}

function scroll ({ dom, offset }) {
  dom.scrollLeft += offset
}

const init = function () {
  let sharedInstance = null
  return function () {
    return sharedInstance || (sharedInstance = new ImageBrowser())
  }
}()

function showOnClick (dom) {
  init().showOnClick(dom)
}

exports.init = init
exports.showOnClick = showOnClick
})));