import debug from 'debug'

const log = debug('app:utils/observe-added-node')

// Options for the observer (which mutations to observe)
// Callback function to execute when mutations are observed
export default function observe(classSelector, callback) {
  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(function onAddedNode(
    mutationsList,
    observer,
  ) {
    mutationsList.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (
            node.classList &&
            node.classList.contains(classSelector)
          ) {
            log('added node detected', node)
            callback(node)

            observer.disconnect()
          }
        })
      }
    })
  })

  // Start observing the target node for configured mutations
  observer.observe(document.querySelector('body'), {
    childList: true,
  })
}
