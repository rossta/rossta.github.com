import debug from 'debug'

import toggleClass from './utils/toggle-class'

const log = debug('app:top-bar-menu')

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.top-bar-menu-button').forEach(el => {
    el.addEventListener('click', event => {
      event.stopPropagation()
      toggleClass(document.querySelector('.top-bar-section'), 'hidden')
      el.querySelectorAll('.icon').forEach(ic => toggleClass(ic, 'hidden'))
    })
  })
})
