---
title: Create and Deploy an Ember App in 5 Minutes
author: Ross Kaffenberger
permalink: /2013/03/create-and-deploy-an-ember-app-in-5-minutes/
tags:
  - Code
---
The [ember-rails][1] gem is a great way to get started with [Ember.js][2] in a Rails project. Another approach is to create and serve an Ember app on a static webpage, totally decoupled from the backend environment. It would be great to have some of the modern front-end development tools we get with something like Rails in a static web environment. A great project to consider for this is [Middleman][3].

 [1]: https://github.com/emberjs/ember-rails
 [2]: http://emberjs.com/
 [3]: http://middlemanapp.com/

Middleman is a static website generator enhanced with some key tools like the asset pipeline. It works really well as an alternative to [Jekyll][4] for rolling a blog. It’s comparable to [Yeoman][5] for the benefits it provides for the front-end workflow, though the underlying tools both are quite different. Middleman builds on top of Rack and Sinatra, so you can take advantage of Rack middleware in development or deployment.

 [4]: https://github.com/mojombo/jekyll
 [5]: http://yeoman.io/

To install middleman:

`$ gem install middleman`

A key feature for getting up and running quickly with Middleman are its use of project templates. You can use some out-of-the-box templates for setting up a Middleman project with the [HTML5 Boilerplate][6]. I’ve got a fork of an [Ember app template][7] that you can download or clone into `~/.middleman/` to get up and running with ember-1.0.0-rc1 with ember-data. To start a new Middleman project with my ember template:

`
$ git clone git://github.com/rossta/middleman-ember-template.git ~/.middleman/ember

$ middleman init my_new_project --template=ember

$ middleman server
`

If everything worked, you should be able to navigate to http://localhost:4567 to see Hello World generated with Ember.

 [6]: http://html5boilerplate.com/
 [7]: https://github.com/rossta/middleman-ember-template

There are lots of options for deploying a Middleman app. To deploy easily with Heroku, we can use a [buildpack][8]. Buildpacks are scripts that take advantage of hooks provided by the Heroku build process and also us to customize what happens when we run “git push heroku master”. For the app generated from my ember template, we’ll want this process to build the Middleman app, which will minify assets and provide cacheable asset urls through the asset pipeline, and serve it on Rack using the [Rack::TryStatic][9] middleware. Luckily, there are already some buildpacks out there that fit these requirements. It’s easy to configure our Heroku app to use a custom buildpack via a git url

`
$ heroku create my_app --buildpack git://github.com/indirect/heroku-buildpack-middleman.git

$ git push heroku master
`

If everything worked, you should be able to see your static web Ember app served up on Heroku.

 [8]: https://devcenter.heroku.com/articles/buildpacks
 [9]: https://github.com/rack/rack-contrib/blob/master/lib/rack/contrib/try_static.rb

I gave a quick lightning talk on this topic at the [Ember.js NYC Meetup][10] yesterday. Check out the slides, [also on Speaker Deck][11]

<script class="speakerdeck-embed" data-id="974b0d70647701301b1e12313b100525" data-ratio="1.29456384323641" src="//speakerdeck.com/assets/embed.js"></script>

 [10]: http://www.meetup.com/EmberJS-NYC/events/100237642/
 [11]: https://speakerdeck.com/rossta/create-and-deploy-an-ember-app-in-5-minutes
