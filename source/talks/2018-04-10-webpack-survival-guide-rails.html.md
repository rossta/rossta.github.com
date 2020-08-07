---
title: A Webpack Survival Guide for Rails Developers
author: Ross Kaffenberger
summary: In 2018, I worked on a project to migrate JavaScript asset bundling over from the Rails asset pipeline over to webpack alongside the Webpacker gem. This talk captures some of the mistakes we made, how we fixed them, and highlights general lessons to help Rails developers understand how webpack works and how it differs from its predecessor.
description: I set out to give the talk I would have wanted to see before making the switch from Sprockets to Webpacker in a large Rails application. This talk captures some of the mistakes we made, how we fixed them, and highlights general lessons to help Rails developers understand how webpack works and how it differs from its predecessor. RailsConf, Pittsburgh PA, April 2018.
pull_image: 'talks/20180419-webpack-survival-guide_key.jpg'
published: true
category: Code
tags:
  - Rails
  - JavaScript
  - Webpack
---

I learned quite a bit (the hard way) helping my team switch our frontend JavaScript application [from the Rails asset pipeline to webpack](/blog/from-sprockets-to-webpack.html). I decided to distill what I learned into a talk I would have wanted to see before I started. This is that talk.

<div class="video-container">
  <iframe src="https://www.youtube.com/embed/fKOq5_2qj54" frameborder="0" allowfullscreen></iframe>
</div>

<br />

<script async class="speakerdeck-embed" data-id="5037cb0f063b425989d5287327d274e7" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>

[Star me on Speaker Deck!](https://speakerdeck.com/rossta/a-webpack-survival-guide-for-rails-developers)

Presented at [RailsConf](https://railsconf.com/program/sessions#session-549) on April 19, 2018 and at [NYC.rb](https://www.meetup.com/NYC-rb/events/ztpmfpyxgbnb/) April 10, 2018.

### Resources

For those interested to learn more about webpack, here are some additional resources I've found helpful in my own learning.

#### Tutorials

- [SurviveJS Wepback](https://survivejs.com/webpack)
- [Webpack from Nothing](https://what-problem-does-it-solve.com/webpack)
- [Webpack Academy Core Concepts](https://webpack.academy/courses/104961)

#### Videos

- [Frontend Center: webpack from First Principles](https://www.youtube.com/watch?v=WQue1AN93YU)
- [Core Concepts](https://www.youtube.com/watch?v=AZPYL30ozCY)
- [Understanding webpack](https://www.youtube.com/watch?v=bm7RlNEcQM0)
- [Webpack: It's Not Magic](https://www.youtube.com/watch?v=U_G7j-DnQCE)
- [CSS Tricks: Let's talk about webpack](https://css-tricks.com/video-screencasts/lets-talk-webpack/)
- [What is webpack How does it work?](https://www.youtube.com/watch?v=GU-2T7k9NfI)
- [Everything is a Plugin, Mastering webpack](https://www.youtube.com/watch?v=4tQiJaFzuJ8)
- [Advanced Concepts](https://www.youtube.com/watch?v=MzVFrIAwwS8)
- [Code-splitting with Wepback: Totally Tooling Tips](https://www.youtube.com/watch?v=QH94CXVv3UE)

#### Sprockets to webpack

- https://rossta.net/blog/from-sprockets-to-webpack.html
- https://brigade.engineering/setting-up-webpack-with-rails-c62aea149679
- https://medium.com/@chrismnicola/leaving-sprockets-for-webpack-ccf7c6993ffa
- http://clarkdave.net/2015/01/how-to-use-webpack-with-rails/
- https://www.codementor.io/help/rails-with-webpack-not-for-everyone-feucqq83z

#### Improving build performance

- https://slack.engineering/keep-webpack-fast-a-field-guide-for-better-build-performance-f56a5995e8f1
- https://medium.lucaskatayama.com/reducing-bundle-js-size-from-webpack-8a9c3adbdad4

#### ES6 Modules

- http://2ality.com/2015/07/es6-module-exports.html
- https://auth0.com/blog/javascript-module-systems-showdown/ (older)

#### UMD

- http://bob.yexley.net/umd-javascript-that-runs-anywhere/
- https://www.davidbcalhoun.com/2014/what-is-amd-commonjs-and-umd/

#### Funny

- [Webpack WTF](https://webpack.wtf)
