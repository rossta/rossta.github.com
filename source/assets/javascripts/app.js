import debug from 'debug'

import '../stylesheets/app.css'
import './top-bar-menu'
import './formkit'

const log = debug('app:app')

import(/* webpackChunkName: "highlight" */ 'syntax-highlight').then(
  ({ default: highlight }) => highlight.highlightAll(),
)

if (__DEVELOPMENT__) {
  log('Running in development mode!')
}

if (__BUILD__) {
  log('Welcome to rossta.net!')
}
