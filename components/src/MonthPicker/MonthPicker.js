;(function (global, factory) {
  
  factory((global.MonthPicker = {}))

}(window, function (exports) { "use strict";

const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const currentMonth = (new Date()).getMonth() + 1

class MonthPickerElement extends HTMLElement {
  constructor () {
    super()

    this.current
    
    this.show = false

    this._currentDOM

    const panel = this._createDOM()
    this._selected(currentMonth)
    
    console.log(this.show)
    // add listener
    panel.addEventListener('click', this._clickHandler.bind(this))
  }

  open () {
    if (this.show) {
      return
    }
    this.show = true
    this.getElementsByClassName('fake-shadow-root')[0].style.display = 'block'
  }

  close () {
    if (this.show) {
      this.show = false
      this.getElementsByClassName('fake-shadow-root')[0].style.display = 'none'
    }
  }

  _createDOM () {
    const fakeShadowRoot = create('div', 'fake-shadow-root')
    const monthPickerPanel = create('div', 'b2-month-picker')
    months.forEach(m => {
      const monthPickerItem = create('div', 'b2-month-picker__item b2-month')
      monthPickerItem.dataset.index = m
      const text = create('span', 'b2-month__text')
      text.textContent = m
      monthPickerItem.appendChild(text)
      monthPickerPanel.appendChild(monthPickerItem)
    })
    fakeShadowRoot.appendChild(monthPickerPanel)
    this.appendChild(fakeShadowRoot)

    return monthPickerPanel
  }

  _selected (month) {
    this.current = month

    const monthPicker = this.getElementsByClassName('b2-month-picker')[0]
    const currentDOM = monthPicker.childNodes[month - 1]
    currentDOM.classList.add('b2-month_selected')
    this._currentDOM = currentDOM
  }

  _clickHandler (e) {
    const event = e || window.event
      let target = event.target || event.srcElement

      if (target === event.currentTarget) {
        return
      }

      let { index } = target.dataset
      while (index === void 0) {
        target = target.parentNode
        index = target.dataset.index
      }

      if (index == this.current) {
        return
      }

      // unselected
      this._currentDOM.classList.remove('b2-month_selected')

      this._selected(index)

      const changeEvent = new CustomEvent('change', { detail: { value: index } })
      this.dispatchEvent(changeEvent)

      event.stopPropagation()
  }
}
customElements.define('month-picker', MonthPickerElement)

function create (tag, className) {
  const dom = document.createElement(tag)
  className && (dom.className = className)
  return dom
}

const cache = new Map()

function get (id) {
  const dom = cache.get(id) || document.getElementById(id)
  cache.set(id, dom)

  return dom
}

exports.get = get
}));