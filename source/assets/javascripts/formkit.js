import debug from 'debug'

import observeAddedNode from './utils/observe-added-node'

const log = debug('app:formkit')

observeAddedNode('formkit-slide-in', (node) => {
  const input = node.querySelector("input[name='email_address']")
  input.type = 'email'
  log('input', input, 'parent node', node)
})
