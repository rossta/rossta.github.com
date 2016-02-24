---
title: What I learned building an app in Hanami
author: Ross Kaffenberger
published: false
summary: Hanami is a Ruby web framework like Rails and not like Rails
description: Hanami (formerly Lotus) is a newish Ruby framework for building web applications. Here's a few things I learned about it coming from Rails.
pull_image: 'https://rossta.net/assets/images/blog/stock/fall-leaves-pexels-photo.jpg'
tags:
  - Code
  - Ruby
---

Why build an app in Hanami?
* Coming from Rails
* What the app is

I've been loosely following the progress on [Hanami](http://hanamirb.org) (formerly Lotus), a new web framework
for Ruby created by [Luca Guidi](https://github.com/jodosha). I recently decided to build a small app in Hanami to get a feel for new framework.
and to understand better a fresh perspective to building for the web in Ruby. In
other words, to answer the question, "Is it better than Rails?"

The app is a simple integration between GitHub integration and the helpdesk platform, [Groove](https://www.groovehq.com).
Visitors can login via OAuth through their GitHub accounts, connect to a Groove
account with an API key, import their Groove tickets, and create GitHub issues
from these tickets through the app. You can see the [source on Github](https://github.com/rossta/github_groove) and play with the [app hosted on Heroku](https://github-groove.herokuapp.com/), where it would help to have accounts on both GitHub and Groove to see how it works.

I've made note of what I learned and some of the challenges I faced while going beyond the [getting
started guides](http://hanamirb.org/guides/) in building the app. This post is not an introduction
to Hanami - the [guides](http://hanamirb.org/guides/) serve as an excellent overview.

<aside class="callout panel">
  <p>The Github-Groove app is built on <code>hanami-0.7.0</code>. As the framework is under
heavy development (as of this writing the latest version is <code>v0.7.2</code>), your experience getting started with Hanami may differ
depending on your version.
  </p>
</aside>

### Hanami opinions are not Rails opinions

Hanami has a lot in common with Rails. Both are web frameworks built on Ruby
that employ some version of the Model-View-Controller pattern and, among other
things, value [convention over configuration](http://rubyonrails.org/doctrine/#convention-over-configuration).
Both frameworks are `opinionated` about how web apps should be built.

If you're coming from Rails, you can expect to learn some new conventions in Hanami.
As the guides warn, "learning these conventions may be hard: [without change, there is no challenge](http://hanamirb.org/guides/getting-started/)". The framework pushes you toward "monolith first" while emphasizing "separation of concerns". There are suggestions in the generated directory structure - the `app/` folder is named `apps/` in Hanami - encouraging you from the start to combine multiple applications under one umbrella, or "container" in Hanami parlance.

Yes, you get useful development tools like generators, migrations, and asset
pipelines in Hanami, but expect less ceremony here. Migrations are just about completely handed off to the
venerable [Sequel](http://sequel.jeremyevans.net/rdoc/files/doc/schema_modification_rdoc.html) project and the asset story is still young but passable.

One gotcha here is that Hanami [does not itself provide any mechanism for code
reloading](https://github.com/hanami/hanami/issues/249) (at the moment). This
was not obvious to me at the start as the development server does "appear" to reload code. It's launched with [Shotgun](https://github.com/rtomayko/shotgun), which I've seen commonly used in Sinatra projects, to serve each development request in a new process with `fork(2)`. I didn't pick up on this until several iterations in when I added the SuckerPunch gem and couldn't figure out why my background jobs would never run in development. Long story short, kicking off background jobs in threads from the request process, as is possible with SuckerPunch, won't work without disabling Shotgun.

Hanami MVC is not Rails MVC
* Controllers
  - are groups of actions,
  - Rails method is now a Rack-style class, implements `#call`, [feature-full](https://github.com/hanami/controller)
  - Mount middleware directly in Actions
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
