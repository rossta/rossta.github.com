import debug from 'debug'

const log = debug('app:enhance')

// ServiceWorker is a progressive technology. Ignore unsupported browsers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister())
  })
} else {
  log('service worker is not supported.')
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.top-bar-menu-button').forEach(el => {
    el.addEventListener('click', event => {
      event.stopPropagation()
      toggleClass(document.querySelector('.top-bar-section'), 'hidden')
      el.querySelectorAll('.icon').forEach(ic => toggleClass(ic, 'hidden'))
    })
  })

  const slideInForm = document.querySelector('.formkit-slide-in')
  if (slideInForm) {
    log('slide in form detected')
  } else {
    log('slide in form NOT detected')
  }
})

function toggleClass(el, className) {
  if (el.classList.contains(className)) {
    el.classList.remove(className)
  } else {
    el.classList.add(className)
  }
}

const targetNode = document.querySelector('body')

// Options for the observer (which mutations to observe)
const config = { childList: true }

// Callback function to execute when mutations are observed
const callback = function(mutationsList, observer) {
  for (let mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.classList && node.classList.contains('formkit-slide-in')) {
          log('formkit slide in', node)
          const input = node.querySelector('input[name=\'email_address\']')
          input.type = 'email'
          log('input', input)
        }
      })
    }
  }
}

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback)

// Start observing the target node for configured mutations
observer.observe(targetNode, config)

// Later, you can stop observing
// observer.disconnect()
