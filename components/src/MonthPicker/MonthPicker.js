;(function (global, factory) {

  factory((global.MonthPicker = {}))
  
}(window, function  (exports) { 'use strict';

const now = new Date()

const defaultOptions = {
  start: '2000',
  end: '2030',
  year: now.getFullYear(),
  month: now.getMonth() + 1,
}

let changeHandler = () => {}

const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

class MonthPicker {

  constructor (opts) {

    this.show = false

    this._ref
    
    this._cacheDOM = {}

    this.opts = this._setProperties(defaultOptions, opts)

    const monthPickerWrapper = create('div', 'b2-month-picker-wrapper')
    const yearPanel = this._createYearPanel()
    const monthPanel = this._createMonthPanel()
    monthPickerWrapper.appendChild(yearPanel)
    monthPickerWrapper.appendChild(monthPanel)
  
    this._selected(+this.opts.year, +this.opts.month)
    
    const fakeShadowDOM = create('div', 'fake-shadow-dom')
    fakeShadowDOM.appendChild(monthPickerWrapper)

    this._dom = fakeShadowDOM

    this._dom.addEventListener('click', e => {
      const event = e || window.event
      event.stopPropagation()
    }, false)
    monthPanel.addEventListener('click', this._clickHandler.bind(this))
  }

  ref (dom) {
    const { bottom, left } = dom.getBoundingClientRect()
    this._dom.style.top = `${bottom}px`
    this._dom.style.left = `${left}px`

    this._ref = dom

    return this
  }

  open () {
    if (this.show) {
      return
    }
    this.show = true
    document.body.appendChild(this._dom)
  }

  close () {
    if (this.show) {
      this.show = false
      document.body.removeChild(this._dom)
    }
  }

  _setProperties (dist, src) {
    if (src === void 0) {
      return Object.assign({}, dist)
    }
    return Object.assign({}, dist, src)
  }

  _selected (year, month) {
    const { yearText, back, forward, monthPanel } = this._cacheDOM
    yearText.textContent = year

    const { start, end } = this.opts
    if (year <= +start) {
      back.classList.add('b2-year-panel__btn_disabled')
    }
    if (year >= +end) {
      forward.classList.add('b2-year-panel__btn_disabled')
    }

    monthPanel.childNodes[month - 1].classList.add('b2-month_selected')
  }

  _createYearPanel () {
    const yearText = create('span', 'b2-year-panel__text')
    const back = create('button', 'b2-year-panel__btn ion-ios-arrow-back')
    const forward = create('button', 'b2-year-panel__btn ion-ios-arrow-forward')

    const yearOperation = (years) => {
      return () => {
        const { year } = this.opts
        const currentYear = +year + years
        this.opts.year = currentYear
        yearText.textContent = currentYear
        return currentYear
      }
    }
    const addOneYear = yearOperation(1)
    const minusOneYear = yearOperation(-1)

    back.onclick = () => {
      const { year, start } = this.opts
      if (+year <= +start) {
        return
      }
      forward.classList.remove('b2-year-panel__btn_disabled')
      if (minusOneYear() <= +start) {
        back.classList.add('b2-year-panel__btn_disabled')
      }
    }
    forward.onclick = () => {
      const { year, end } = this.opts
      if (+year >= +end) {
        return
      }
      back.classList.remove('b2-year-panel__btn_disabled')
      if (addOneYear() >= +end) {
        forward.classList.add('b2-year-panel__btn_disabled')
      }
    }

    const panel = create('div', 'b2-month-picker__year-panel')
    panel.appendChild(back)
    panel.appendChild(yearText)
    panel.appendChild(forward)

    Object.assign(this._cacheDOM, { back, forward, yearText })

    return panel
  }

  _createMonthPanel () {
    const panel = create('div', 'b2-month-picker__month-panel')
    months.forEach(m => {
      const month = create('div', 'b2-month-panel__item b2-month')
      month.dataset.month = m
      const text = create('span', 'b2-month__text')
      text.textContent = m
      month.appendChild(text)
      panel.appendChild(month)
    })

    Object.assign(this._cacheDOM, { monthPanel: panel })

    return panel
  }

  _clickHandler (e) {
    const event = e || window.event
    let target = event.target || event.srcElement

    if (target === event.currentTarget) {
      return
    }

    let { month } = target.dataset
    while (month === void 0) {
      target = target.parentNode
      month = target.dataset.month
    }

    if (month !== this.opts.month) {
      // unselected
      const monthElement = this._cacheDOM.monthPanel.childNodes;
      [...monthElement].forEach(e => e.classList.remove('b2-month_selected'))
  
      monthElement[month - 1].classList.add('b2-month_selected')
    }

    // const changeEvent = new CustomEvent('change', {
    //   detail: {}
    // })
    changeHandler(this._ref, { month, year: this.opts.year })
    this.close()
    // this._dom.dispatchEvent(changeEvent)

    event.stopPropagation()
  }
}

function create (tag, className) {
  const dom = document.createElement(tag)
  className && (dom.className = className)
  return dom
}

function setOptions (opts) {
  Object.assign(defaultOptions, opts)
}

const instance = function () {
  let sharedInstance
  return function (opts) {
    return sharedInstance || (sharedInstance = new MonthPicker(opts))
  }
}()

const onChange = function  (callback) {
  changeHandler = callback
}

const close = function () {
  instance().close()
}

;(function () {
  [...document.getElementsByClassName('b2-month-picker')].forEach(input => {
    input.addEventListener('click', e => {
      instance().ref(input).open()
      const event = e || window.event
      event.stopPropagation()
    }, false)
  })
  document.addEventListener('click', e => {
    instance().close()
  }, false)
})()
  
exports.setOptions = setOptions
// exports.instance = instance
exports.onChange = onChange
exports.close = close
}));