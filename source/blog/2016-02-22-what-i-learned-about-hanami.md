---
title: What I learned building an app in Hanami
author: Ross Kaffenberger
published: true
summary: A lightweight alternative to Rails
description: Hanami (formerly Lotus) is a newish Ruby framework for building web applications. Here's a few things I learned about it coming from Rails.
pull_image: 'https://rossta.net/assets/images/blog/stock/fall-leaves-pexels-photo.jpg'
tags:
  - Code
  - Ruby
---

For the past year, I've been loosely following the progress on [Hanami](http://hanamirb.org) (formerly Lotus), a new web framework
for Ruby created by [Luca Guidi (@jodosha)](https://github.com/jodosha). I recently decided to build a small app in Hanami to get a feel for its design and to understand better its fresh perspective on web development in Ruby. In other words, to answer for myself, "Is Hanami better than Rails?"

[The app](https://github.com/rossta/github_groove) is a simple integration between GitHub issues and the helpdesk platform, [Groove](https://www.groovehq.com).
Visitors can login via OAuth through their GitHub accounts, connect to a Groove
account with an API key, import their Groove tickets, and create GitHub issues
from these tickets through the app. You can see the [source on Github](https://github.com/rossta/github_groove) and play with the [app hosted on Heroku](https://github-groove.herokuapp.com/), where it would help to have accounts on both GitHub and Groove to see how it works.

I've made note of what I learned and some of the challenges I faced while going beyond the [getting
started guides](http://hanamirb.org/guides/) to build and deploy the app. This post is not an introduction
to Hanami - the [guides](http://hanamirb.org/guides/) serve as an excellent overview.

<aside class="callout panel">
  <p>The Github-Groove app is built on <code>hanami-0.7.0</code>. As the framework is under
heavy development (as of this writing the latest version is
<code>v0.7.2</code>), your experience getting started with Hanami may differ.
  </p>
</aside>

### Hanami opinions are not Rails opinions

Hanami has a lot in common with Rails. Both are web frameworks built on Ruby
that employ some version of the Model-View-Controller pattern and, among other
things, value [convention over configuration](http://rubyonrails.org/doctrine/#convention-over-configuration).
Both frameworks are *opinionated* about how web apps should be built. In a
nutshell, Hanami takes what it likes from Rails and draws the line on certain
principles including avoidance of monkey-patching, enforcing modularity, and encouraging
the use of "plain old Ruby objects".

If you're coming from Rails, you can expect to learn some new conventions in Hanami.
[As the guides warn](http://hanamirb.org/guides/getting-started/),

> learning these conventions may be hard: without change, there is no challenge

The framework pushes you toward "monolith first" while emphasizing "separation of concerns". There are suggestions in the generated directory structure like how the `app/` folder is named `apps/` in Hanami encouraging you from the start to define sub-applications boundaries under one umbrella, or "container" in Hanami parlance. So while in Rails has engines as an opt-in feature, you build everything as an engine in Hanami. Each "app" gets its own set of views, controllers, assets, configuration, etc. Shared resources, like models, tend to go in `lib/`.

You also get useful development tools like generators, migrations, and asset
pipelines in Hanami, but expect less ceremony here. Migrations handed off to the
venerable [Sequel](http://sequel.jeremyevans.net/rdoc/files/doc/schema_modification_rdoc.html) project and the asset story is still young but passable; you won't be able to take advantage of the multitude of Rails-asset gems.

I'd be interested to see Hanami go in a different direction here, like taking advantage of the "frontend explosion" by providing integration with external pipelines as the static-site generator [middleman has done](https://middlemanapp.com/advanced/external-pipeline/) or what [Shakacode](http://www.shakacode.com/) is trying with [webpack](https://webpack.github.io/) in [`react_on_rails`](https://github.com/shakacode/react_on_rails).

It's worth noting that Hanami comes with security features baked in for as one would expect, including [CSRF protection](https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF)) and app-level secure-by-default options for items like [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/Security/CSP) and `X-Frame-Options`.

One gotcha is that Hanami [does not itself provide any mechanism for code
reloading](https://github.com/hanami/hanami/issues/249) (at the moment). This
was not obvious to me starting off since the development server does "appear" to reload code. It turns out that the dev server launches with [Shotgun](https://github.com/rtomayko/shotgun) (commonly used in Sinatra projects), to serve each development request in a new process with `fork(2)`. I didn't pick up on this until several iterations in when I added the [SuckerPunch gem](https://github.com/brandonhilkert/sucker_punch) and couldn't figure out why my background jobs wouldn't run in development. I added a [sync action](https://github.com/rossta/github_groove/blob/4cb64e1a92013cf6eb56a3abd6678020640eaf5c/apps/web/controllers/tickets/sync.rb#L11) that allows users to trigger a [background job to import ticket data](https://github.com/rossta/github_groove/blob/4cb64e1a92013cf6eb56a3abd6678020640eaf5c/lib/github_groove/jobs/sync_tickets_job.rb) from Groove into the application. Long story short, kicking off background jobs in threads in the request process, as is possible with SuckerPunch, won't work without disabling Shotgun.

### Hanami MVC is not Rails MVC

With the Model-View-Controller paradigm, you'll see some big departures from
Rails. First, controllers are not classes with "RESTful" methods, but
*directories* of related action classes. In other words, instead of defining
`#index`, `#show`, `#create`, etc. in a `PostsController`, you create a separate
class for each action using a mixin that live in a directory that would
represent a single controller in Rails.

In my Github-Groove app, here's how I organize the tickets controller:

```sh
app/
  web/
    assets/
    config/
    controllers/
      tickets/
        index.rb
        show.rb
        sync.rb
    templates/
    views/
    ...
```

Each "action" is a Rack-inspired class whose contract is only that it responds to `#call`. You still get
familiar macros like `before` filters, but there are new ideas too, like declaring what instance variables are available to the view with `expose`, inserting action-specific middleware, and whitelisting `params` at the class level, all of which I find to be huge improvements over the Rails controller design.

```ruby
module Web::Controllers::Project
  class Create
    include Web::Action

    expose :project
    before :authenticate!

    params do
      param :project do
        param :groove_access_token, presence: true
        param :github_repository, presence: true
      end
    end

    def call(params)
      if params.valid?
        @project = ProjectRepository.find_or_create_by_params(params[:project])
        UserRepository.update_user_project(current_user, @project)

        flash[:notice] = "Your project has been saved!"

        redirect_to "/project"
      end
    end
  end
end
```

Arguably, the biggest efforts in Hanami appear to be at this action layer and it
shows in the [guides](http://hanamirb.org/guides/actions/overview/) and the
[README](https://github.com/hanami/controller/blob/master/README.md) where you
can find a ton of great information customizing these classes.

Another big benefit in the controller design, and for most of the Hanami
framework, is that unit-testing has a much lower barrier to entry. To get
controller tests to work in Rails requires a ton of setup behind the scenes to
the point where you essentially have integration tests. Controllers tests in
Hanami are much simpler by the simple fact that getting a testable object is as
easy as [instantiating a Hanami action](https://github.com/rossta/github_groove/blob/4cb64e1a92013cf6eb56a3abd6678020640eaf5c/spec/web/controllers/project/create_spec.rb#L5).

In Hanami, "views" are classes that act more like presenter to represent a model
or collection of models for the "templates", which the place of the
`views/` folder in Rails. Like Rails, file-naming conventions link an action,
view, and template. The helper method story is still developing, but you can
expect to find some surprises in the docs, like the criticism of Rails
monkey-patching of ERB to achieve block-style helpers for things like forms.
Expect to get tripped up by these differences in helper syntax which ironically are
valid ERB. Hanami does support all the other popular templating engines through
[Tilt](https://github.com/rtomayko/tilt) for your preference.

Hanami also provides `hanami-model` for the model layer as a soft-dependency so
you can bring your own ORM if desired. If you choose to use `hanami-model` as I
did, you can expect to leave your ActiveRecord convenience (and baggage) behind.
Hanami's model layer emulates the [repository pattern](http://martinfowler.com/eaaCatalog/repository.html) where database queries, table mapping, and entities are all separate concerns.

Repositories become a collection of query methods:

```ruby
class ProjectRepository
  include Hanami::Repository

  def self.find_or_create_by_params(params)
    found = find_by_groove_access_token(params[:groove_access_token])

    if found
      found.update(params)
      update found
    else
      create(Project.new(params))
    end
  end

  def self.find_by_groove_access_token(groove_access_token)
    query do
      where(groove_access_token: groove_access_token)
    end.first
  end
end
```

Entities feel basically like POROS that provide a thin layer over attributes.
Don't expect to find any database access, validations (by default anyhow), or callbacks here.

```ruby
class Project
  include Hanami::Entity

  attributes :groove_access_token, :github_repository, :syncing

  def ready?
    groove_access_token.present? && github_repository.present?
  end

  # ...
end
```

Validations do exist in Hanami [as a separate mixin](https://github.com/hanami/validations) but these are more typically done in the params macro at the action-layer.

## Expect to write code

While Hanami has its own variety of "magic" of the kind that developers have come to
either love or hate in Rails, you can expect to write code you might not
otherwise have to in Rails. The framework is still young, so there are missing
features. What's not always clear is whether these features have been left out
by priority or choice. To figure that out takes some digging on GitHub issues, the Hanami [chat](https://gitter.im/hanami/chat) and [Discourse forum](https://discuss.hanamirb.org/).

Though its database layer has the [Sequel](https://github.com/jeremyevans/sequel) library as a foundation, I didn't find the repository and entity functionality as fully-developed. I found myself writing a lot of boilerplate code in the entities and repositories with a lot of co-dependence between the classes. With some more thoughtful design and refactoring, I could probably address this issue, but at this stage, the separation of concerns is less apparent: entities and repositories appear to be tightly bound. [Convenience methods](https://github.com/hanami/model/issues/291) are still in the works.

For one, [associations](https://github.com/hanami/model/pull/244) are still in development at the time of this writing (see open issue [here](https://github.com/hanami/model/issues/35)). Much of my entity code was to fill this gap - to load objects linked by foreign keys via repositories like below.

```ruby
class Project
  include Hanami::Entity

  def tickets(params = {})
    TicketRepository.all_by_project(self, params)
  end
end

class TicketRepository
  include Hanami::Repository

  def self.all_by_project(project, _params = {})
    query do
      where(project_id: project.id).desc(:number)
    end.all
  end

  # ...
end
```

I'm not sure if this is the "Hanami-way", but I found myself doing this kind of
thing a lot.

I also ran into some unexpected issues while deploying the application to Heroku
where its `HANAMI_ENV` is set to `'production'`. In many cases, custom classes I
extracted, like one for sharing [a pagination query](https://github.com/rossta/github_groove/blob/4cb64e1a92013cf6eb56a3abd6678020640eaf5c/lib/github_groove/repositories/pagination.rb) and another for [wrapping the `Groove API Ruby Client`](https://github.com/rossta/github_groove/blob/4cb64e1a92013cf6eb56a3abd6678020640eaf5c/lib/github_groove/vendor/groove.rb) (my [fork with paginated enumeration](https://github.com/Fodoj/groovehq/pull/16)) weren't "autoloaded" when booting the Hanami application. To resolve this, I added explicit requires like `require_relative './pagination'`. Again, I didn't have time to dig into whether this issue would be expected or not; I could have been missing something important here.

### The Community is still young

That brings me to the community - it's extremely supportive, but still very
small. I encountered a lot of helpful folks on
[chat](https://gitter.im/hanami/chat) including `@jodosha` himself, but there
simply hasn't been enough traction to reach [StackOverflow](https://stackoverflow.com/questions/tagged/hanami) critical mass where just about any question you can think of in Rails already has an answer.

This means a lot more code-spelunking in the [hanami](https://github.com/hanami) repositories. To that end, I found the code extremely clean, well-documented, and approachable whereas, even today, I need to brace myself before diving into Rails source.

That said, you can expect to run into edge cases and bugs occasionally that may
not yet have a solution, including this [incredibly irksome](https://github.com/pry/pry/issues/1471#issuecomment-187420164) issue that prevents you from accessing the pry console when using `binding.pry` in Hanami controllers and the problem I mentioned earlier that prevents you from using SuckerPunch in development with Shotgun enabled.

Another challenge is that all those Rails-specific plugins and engines
you've come to rely on won't work in Hanami: Yikes, you have build authentication without Devise!
Using [`Warden`](https://github.com/hassox/warden), the general Rack-based
authentication middleware on which Devise is based, is very feasible and you can always
rely on [OmniAuth like I did](https://github.com/rossta/github_groove/blob/4cb64e1a92013cf6eb56a3abd6678020640eaf5c/apps/web/application.rb#L86).

The lesson here is that with Hanami, you're much more likely to have to "roll up
your sleeves" to get to the bottom of issues, figure how to do things that
aren't covered by the guides, or otherwise, get from a Rails-specific gem.

### Hanami is and is not Rails

So should you build your next app in Hanami? Only you can answer that of course.
The lightweight approach in Hanami means there is less to wrap your head around
if you're coming from Rails, but there is still a learning curve nonetheless. I'd say it's a worthwhile endeavor to build something small like I did at first to push the boundaries and answer the questions you have about Hanami for yourself.

Hanami treads the same ground as Rails and aims to do a lot of the low level
work for you so can focus on what's important - your business logic. Personally, I found a lot of advantages in the "Hanami way" and enjoyed the experience of the new paradigm. My "Rails muscle memory" tripped me up on occasion and left me pining for features that don't exist or are not as well-developed in Hanami yet. I see a lot of potential in the Hanami framework and see it growing into a viable alternative to Rails in the near future.

Check out the [GitHub-Groove source](https://github.com/rossta/github_groove) and [demo app](https://github-groove.herokuapp.com/) and let me know what I could have done differently.
