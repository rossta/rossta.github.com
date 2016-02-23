---
title: What I learned about Hanami
author: Ross Kaffenberger
published: false
summary: What to expect in Hanami coming from Rails
description: Hanami (formerly Lotus) is a newish Ruby framework for building web applications. Here's a few things I learned about it coming from Rails.
pull_image: 'https://rossta.net/assets/images/blog/stock/fall-leaves-pexels-photo.jpg'
tags:
  - Code
  - Ruby
---

Why build an app in Hanami?
* Coming from Rails
* What the app is

Hanami opinions are not Rails opinions
* Convention over configuration
* Different conventions!
  - layout
  - architecture
  - code reloading
  - Migrations via [Sequel](http://sequel.jeremyevans.net/rdoc/files/doc/schema_modification_rdoc.html)
  - Generators
* [Monolith first](http://hanamirb.org/guides/architectures/container/)
* Learning these conventions may be hard: [without change, there is no challenge](http://hanamirb.org/guides/getting-started/)

Hanami MVC is not Rails MVC
* Controllers are actions, Rails method is now a Rack-compatible class -
  implements `#call`, [feature-full](https://github.com/hanami/controller)
* Mount middleware directly in Actions
* Views, Templates
* Repositories and Entities instead of ActiveRecord

Expect to write more code
* [Repositories and data](https://github.com/hanami/model/issues/291)
* Pining for missing features
* Assets
* [Associations](https://github.com/hanami/model/pull/244) and [here](https://github.com/hanami/model/issues/35)

The Community is still young
* Authentication
* Pagination
* Errors - view tests, sucker punch
* Community [chat](https://gitter.im/hanami/chat) and [Discourse forum](https://discuss.hanamirb.org/)
  [StackOverflow](https://stackoverflow.com/questions/tagged/hanami)

Expect Gotchas
* [Shotgun](https://github.com/rtomayko/shotgun)

Reasons for choosing Hanami
* Lightweight (55 gems to 31 gems in fresh install)
* Architecture
* Thread-safe

Hanami is and is not Rails

---
