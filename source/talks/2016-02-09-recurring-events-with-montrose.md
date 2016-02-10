---
title: Recurring events in Ruby
author: Ross Kaffenberger
summary: Modeling recurrence with the Montrose gem
description: A talk on how to define, enumerate, and query recurrence objects in Ruby using the Montrose gem
pull_image: 'https://rossta.net/assets/images/blog/stock/clock-pexels-photo.jpg'
published: true
tags:
  - Code
  - Ruby
---

At [NYC.rb][2], I introduced [`Montrose`][1], a gem I created to model recurrence in Ruby.

<script async class="speakerdeck-embed" data-id="c3a8f9bf434749e690004a121eaf3ee5" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>

<hr />

Why would you need [`Montrose`][1]? Well, a calendaring or scheduling application may reach a point where it needs to handle entries that repeat at predefined intervals; it may useful to have an abstraction to represent that recurrence.  How would you handle "every Friday 13th, forever"? It wouldn't be feasible to generate infinite events upfront to represent each instance - `Montrose` helps
you define and enumerate these recurrences on demand.

```ruby
# Friday the 13th, forever
Montrose.monthly(on: { friday: 13 })
```

I also [wrote plenty of examples using Montrose][3] if you're interested to learn more.

[Go ahead and star the project on GitHub][1] and fork the project to contribute.

[1]: https://github.com/rossta/montrose
[2]: http://www.meetup.com/NYC-rb/events/223864952/ "NYC.rb"
[3]: https://rossta.net/blog/recurring-events-in-ruby.html
