---
title: Why I'm betting on Elixir
author: Ross Kaffenberger
published: true
summary: Looking beyond Ruby for the next big thing
description: Starting a new web application? Take a good look at Elixir which can help scale with the needs of a business and still be really fun to use.
pull_image: 'blog/stock/purple-sunset-beach-pexels-photo.jpg'
series:
category: Code
tags:
  - Elixir
---

While reading the first chapter of [*Elixir in
Action*](https://www.manning.com/books/elixir-in-action), I had my "a-ha!"
moment with Elixir; this table:

[![](screenshots/screenshot-elixir-in-action-table-1.1.jpg)](https://www.manning.com/books/elixir-in-action)

I'd already been playing with Elixir for a few month when before I picked up
Sasha Juric's book introducing the Elixir language and its abstractions for the
Open Telecom Platform (OTP). If you're interested in Elixir, [please check out
the book](https://www.manning.com/books/elixir-in-action); no affiliate links, I
just enjoyed it immensely.

[Elixir](http://elixir-lang.org/) is a new programming language that targets the
Erlang virtual machine.  Therefore, it comes with many of the benefits of
[Erlang](https://www.erlang.org/), including fault tolerance, scalability,
distribution, and concurrency, in a cleaner, more concise syntax. I knew all
this but the graphic above revealed a new perspective, especially in regards to
web development as we know it in the Rails community.

## Using your tools

Anyone who has built a non-trivial Ruby on Rails app (or Node.js, Django, PHP,
etc.) knows the left-side of the table above well. When we deploy a Rails app,
we don't just set up the Rails process. We need a web server like Nginx, Apache,
or Phusion Passenger, to queue requests and serve static content, neither of
which Rails does well.

Running background jobs becomes an essential tool for moving intensive tasks out
of the request/response process, typically requiring separate processes, e.g.
Sidekiq, often deployed on other servers. Setting up additional caching
processes in Redis or Memcached is also an assumed requirement for storing HTML
fragments or other bits of precalculated data. See the theme? performance
improvements in Ruby apps often mean avoiding Ruby.

Getting all these separate dependencies up and running for development often requires
complicated setup or additional tools like Docker/Vagrant/Boxen, etc. Keeping
them running in production means relying on a yet another service to
act as a supervisor or monitor like [Upstart](http://upstart.ubuntu.com/) or
[Monit](https://mmonit.com/monit/).

In Elixir, all these features can be handled by the Erlang virtual machine
(called BEAM) in a *single* operating system process. The runtime itself is
behaves like its own operating system that provides its lightweight processes
and a scheduler. In a web application, this means responses to web requests and
background jobs can run concurrently, all within the same BEAM process. Elixir
and Erlang have built-in abstractions for supervising processes in your
application, so you can provide fine-grained logic for monitoring and restarting
failed tasks within your project as an integral part of your business logic.
There are also built-in tools for persisting and sharing state in place of
separate tools like Redis or Memcached.

Setting up the project on the development machine and deployment considerations
all becomes much simpler when you're concerned only with the requirements of
managing a single OS process.

We're obviously free to use these other tools (Redis, memcached, a separate jobs
queue, a web server, etc.) but they no longer need to be the default in Elixir.
If you're building a web app in [Phoenix](http://www.phoenixframework.org/), you
still may need a database, and you'll probably still feel the need to pick
a JavaScript framework. But you get the idea.

As I discovered this, I tweeted it out, imagining all the money saved on hosting
costs. Here's [Sasha's response](https://twitter.com/sasajuric/status/750078059286556673).

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr"><a
href="https://twitter.com/rossta">@rossta</a> That&#39;s the smallest gain.
Imagine all the money saved on not developing/maintaining overcomplex error
prone solutions :-)</p>&mdash; Saša Jurić (@sasajuric) <a
href="https://twitter.com/sasajuric/status/750078059286556673">July 4,
2016</a></blockquote> <script async src="//platform.twitter.com/widgets.js"
charset="utf-8"></script>

So Elixir has some measurable benefits.

## Choosing your tools

I've never much enjoyed the phrase "right tool for the job". We programmers
often fall back on this phrase as a way to justify our technology choices. In my
experience, there are many possible languages/frameworks (the "tools") that can
serve the needs of a given business (the "job"). As my professional software experience
is largely based on building web applications for startups, I don't wish to
speak for systems software, game programmers, or even mobile app developers. But
on the web, there exist a great number of tools serving teams quite well,
and it would difficult for me to call any of them *the* right tool.

The trouble I have with "right tool for the job" is we tend to focus our
arguments on technology features and capabilities, but very rarely do we
consider factors such as our current constraints or the people involved in as
part of the equation. The team has 25 years of experience building Node.js web
apps? We're probably going to be choosing Node.js for our next web app. The
DevOps team invested months and thousands of dollars in shoring up our
architecture for Ruby on Rails? I probably won't be switching to Django for our
next feature.

How about admitting we'd most often love to choose the tools we'd
most enjoy using? This is a much more personal choice than "right tool"
suggests. I don't think there's anything wrong with choosing tools you like -
as long as you can still get the job done, of course!

Giles Bowkett wrote a [thoroughly entertaining essay on why the Rails asset
pipeline should
die](http://gilesbowkett.blogspot.com/2016/10/let-asset-pipeline-die.html),
which is really an essay about the fundamental nature of Ruby and Rails. He
reminds us that a big reason for the success of Ruby and of Rails is that they
optimize for programmer happiness. Ruby isn't successful for its performance
benefits, (if anything, it's successful in spite of performance), but because
programmers really eff-ing love writing Ruby.

Which brings me to back to Elixir: writing Elixir is so darn fun. For a Rubyist
getting introduced to Elixir for the first time, the surface area of the language feels
familiar. We get new concepts, like pattern matching, guard clauses, and
comprehensions. Working with OTP abstractions feels a bit foreign at first, but once this
flavor starts to sink in, we may start to regain some of that feeling of how
exciting it can be to play with new ideas (new, at least, to Rubyists).

With all abstractions and functionality provided by the Elixir language, and its
ability to scale, handle fault tolerance, to be distributed - I can't imagine a
technology choice better suited for the web.  These traits alone may help
convince engineering leads to go along with Elixir for the next web app, i.e.,
"right tool for the job".  Maybe our next web app doesn't truly need the
concurrency or scalability made possible by the BEAM virtual machine, but it's
sure fun to learn how to take advantage of it and be able to apply it when
necessary.

I haven't been this excited about a language and its primary web framework,
since, well, Ruby on Rails came along.

With Elixir we get a tool that's both fun to use and that can scale with the needs
of the business. From the start, it's like getting the best of Ruby and whatever you think you
will replace it with later. Something about that just feels right.

<div class="callout panel">
<p>
  If you're interested in Elixir and in New York City on Thursday, Oct 27 2016, please check out the <a href="http://empex.co">Empire City Elixir Conference Halloween Lightning Talks</a>. Registration is free and you'll get to meet folks in the blossoming Elixir community in New York City at a really cool venue.
</p>
</div>
