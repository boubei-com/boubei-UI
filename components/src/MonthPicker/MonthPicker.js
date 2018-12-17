;(function (global, factory) {
  
  factory((global.MonthPicker = {}))

}(window, function (exports) { "use strict";

class MonthPickerElement extends HTMLElement {
  constructor () {
    super()

    const shadow = this.attachShadow({ mode: 'closed' })
    var wrapper = document.createElement('span');
    wrapper.textContent = 'abc'
    wrapper.setAttribute('class','wrapper');
    var style = document.createElement('style');
    style.textContent = '.wrapper {position: relative;}'
    shadow.appendChild(style)
    shadow.appendChild(wrapper)

    this.addEventListener('click', e => {
      console.log(e)
    })
  }
}
customElements.define('month-picker', MonthPickerElement)

const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

class MonthPicker {
  constructor () {
    this.current

  }
}
  
}));