---
title: Introducing Montrose for recurring events
author: Ross Kaffenberger
published: false
summary: Introducing the Montrose library for recurring events
description: Montrose is an easy-to-use library for defining recurring events in Ruby. It uses a simple chaining system for building recurrences, inspired heavily by the design principles of HTTP.rb and rule definitions available in the Recurrence gem.
pull_image: 'https://rossta.net/assets/images/blog/stock/fall-leaves-pexels-photo.jpg'
tags:
  - Code
  - Ruby
---

I was considering recently how I'd build an [Edgar](http://meetedgar.com/) clone to post updates to
Twitter and LinkedIn on recurring intervals, like sharing links to [rossta.net](/) every Tuesday at 9AM EST.

Of course, for scheduling tasks, we have [cron](http://www.unixgeeks.org/security/newbie/unix/cron-1.html) at the system llevel and even options like [`whenever`]() to setup cron from Ruby at the application level. Rails and other Ruby applications can take advantage of fantastic background job schedulers like [`rufus-scheduler`](https://github.com/jmettraux/rufus-scheduler) to run recurring Ruby tasks from a separate process or even an API for defining recurring Sidekiq job queue through [`Sidetiq`](https://github.com/tobiassvn/sidetiq). But this post isn't about these solutions.

For an Edgar clone, we need a layer for users of the application to define
their own recurrence schedules. This means finding a way to represent time-based recurrences so they are:

1. serializable, so we can save them to the database, and
2. enumerable, so we can determine when the next post(s) should be shared on designated social networks.

A fully-featured solution for this exists in Ruby: [`ice_cube`](https://github.com/seejohnrun/ice_cube). If you're looking for a more-mature solution to the problem of modeling recurring events in Ruby, please check it out. I did, and highly recommend it. After playing with it for awhile, I found felt the urge for alternative semantics - like the ability to define a recurrence without a start date - and API similar to the hash-like syntax provided by another less-active recurring events library, [`recurrence`](https://github.com/fnando/recurrence).

I thought of the [`HTTP`](https://github.com/httprb/http) gem which bills
itself as the following:

> HTTP (The Gem! a.k.a. http.rb) is an easy-to-use client library for making requests from Ruby. It uses a simple method chaining system for building requests, similar to Python's [Requests](http://docs.python-requests.org/en/latest/).

Taking a cue from `http.rb` and the `recurrence` gem, I set out to create something similar for recurring events.

Introducing [`Montrose`](https://github.com/rossta/montrose).

Montrose allows you to easily create "recurrence" objects through chaining:

```ruby
Montrose.weekly.on(:monday).at("10:30 am")
=> #<Montrose::Recurrence...>
```

and the constructor hash-syntax:

```ruby
Montrose::Recurrence.new(every: :week, on: :monday, at: "10:30 am")
=> #<Montrose::Recurrence...>
```

A Montrose recurrence responds to `#events`, which returns an
`Enumerator` to generate timestamps representing the recurrences:

```ruby
r = Montrose.hourly
=> #<Montrose::Recurrence...>

r.events
=> #<Enumerator:...>

r.events.take(10)
=> [2016-02-03 18:26:08 -0500,
2016-02-03 19:26:08 -0500,
2016-02-03 20:26:08 -0500,
2016-02-03 21:26:08 -0500,
2016-02-03 22:26:08 -0500,
2016-02-03 23:26:08 -0500,
2016-02-04 00:26:08 -0500,
2016-02-04 01:26:08 -0500,
2016-02-04 02:26:08 -0500,
2016-02-04 03:26:08 -0500]
```

Montrose recurrences are themselves enumerable:

```ruby
r = Montrose.monthly.starting(1.year.from_now).on(friday: 13).repeat(5)

r.map(&:to_date)
=> [Fri, 13 Oct 2017,
Fri, 13 Apr 2018,
Fri, 13 Jul 2018,
Fri, 13 Sep 2019,
Fri, 13 Dec 2019]
```

Each chained recurrence returns a new object so they can be composed and
merged:

```ruby
r1 = Montrose.every(:week)
r2 = Montrose.on([:tuesday, :thursday])
r3 = Montrose.at("12 pm")
r4 = Montrose.total(4)

r1.merge(r2).merge(r3).merge(r4).to_a
=> [2016-02-04 12:00:00 -0500,
2016-02-09 12:00:00 -0500,
2016-02-11 12:00:00 -0500,
2016-02-16 12:00:00 -0500]
```

With a nod to DHH and the [Rails doctrine](http://rubyonrails.org/doctrine), Montrose aims to [optimize for programmer happiness](http://rubyonrails.org/doctrine/#optimize-for-programmer-happiness). Hence, there are several ways to define equivalent recurrences. For example, recurrences intervals can be configured as an explicit option, or inferred by the duration of the frequency (provided through `:every`).

```ruby
# equivalent
Montrose.hourly.interval(3)
Montrose.every(3.hours)
Montrose::Recurrence.new(every: :hour, interval: 3)
Montrose::Recurrence.new(every: 3.hours)
```

`Montrose` aims to provide useful feedback when you run into exceptions:

```ruby
r = Montrose::Recurrence(total: 1)
r.each { |t| puts t}
Montrose::ConfigurationError: Please specify the :every option
```

Conceptually, recurrences can represent an infinite sequence. When we say
simply "every day", there is no implied ending. It's therefore possible to
create a recurrence that can enumerate forever.

```ruby
r = Montrose.daily

# this expression will never complete, Ctrl-c!
r.map(&:to_date)

# so use your `Enumerable` methods wisely
r.lazy.map(&:to_date).select { |d| d.mday > 25 }.take(5).to_a
=> [Fri, 26 Feb 2016,
Sat, 27 Feb 2016,
Sun, 28 Feb 2016,
Mon, 29 Feb 2016,
Sat, 26 Mar 2016]
```

Since recurrences can be created from hash options, it's
straightforward to convert a recurrence back to a hash.

```ruby
opts = Montrose.every(10.minutes).to_h
=> {:every=>:minute, :interval=>10}

Montrose::Recurrence.new(opts).take(3)
=> [2016-02-03 19:06:07 -0500,
2016-02-03 19:16:07 -0500,
2016-02-03 19:26:07 -0500]
```

Accordingly, `Montrose::Recurrence` implements `.dump` and `.load` so that you can use along with the `serialize` feature of `ActiveRecord` and back a
recurrence by a database column for models in your Rails apps:

```ruby
class EventSeries < ActiveRecord::Base
  serialize :recurrence, Montrose::Recurrence
end

es = EventSeries.new(recurrence: Montrose.daily.at("12pm"))
es.save

es = EventSeries.last
es.recurrence
# => #<Montrose::Recurrence:...>
```

This library is still in its early stages (version `0.2.1` as of this writing) and aspects of the API are still in flux, such as the ability to configure default start and end times or combines multiple, distinct recurrences in a `Montrose::Schedule`.

There are [plenty of missing features](https://github.com/rossta/montrose/issues), including iCal serialization though Montrose already [supports most of the examples](https://github.com/rossta/montrose/blob/master/spec/rfc_spec.rb) given by the iCal spec, [rfc2445](https://www.ietf.org/rfc/rfc2445.txt).

I still haven't built that Edgar clone, but feel this is a good place from which to grow. As I said earlier, the `ice_cube` gem is a mature library and already does much of what I've described here. If, however, you like what `Montrose` has to offer and you're feeling adventurous, try it out in your own application and send some feedback. Don't hesitate to [fork the project](https://github.com/rossta/montrose) and contribute.
