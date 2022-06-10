---
title: Enumerable - Why I Fell in Love with Ruby
author: Ross Kaffenberger
summary: Using Ruby's Enumerable module and Enumerator class
description: You may not be using enough of the Enumerable API or doing enough with Enumerator.
thumbnail: 'blog/enumerator-1-2-3.jpg'
published: true
series: Enumerable
category: Code
tags:
  - Ruby
---

I like to say I started programming by accident. While facilitating a Lego robotics club during my teaching years, I was surprised to realize how much I enjoyed coding. Later, when I first learned Ruby as a full-time developer, I rediscovered that joy.

A big reason for my love of Ruby is the [Enumerable][1] module because of its simple, functional style and ability to be combined and chained to form useful constructs - a lot like Legos.

I recently gave a talk at both [NYC.rb][2] and [DCRUG][3] about some great features of `Enumerable` that deserve more attention. I touch on interesting use cases for using `Enumerable` and `Enumerator` including API client libraries, streaming HTTP, web crawlers, CSV parsing, and infinite sequences.

<script async class="speakerdeck-embed" data-id="df623bc08aa642328c303a619c92fab0" data-ratio="1.55386949924127" src="//speakerdeck.com/assets/embed.js"></script>

I put together a bunch of code samples for the talk and assembled them in a repository on GitHub:

[https://github.com/rossta/loves-enumerable][4]

To run a sample, clone the repo and install the gems:

```bash
$ git clone https://github.com/rossta/loves-enumerable.git
$ cd loves-enumerable
$ bundle install
```

Then simply run the code with the ruby executable.

```bash
$ ruby code/pascals_triangle.rb
```

You'll get the most out of this repo by inspecting the source along with following the presentation.

[1]:	http://ruby-doc.org/core-2.2.3/Enumerable.html
[2]:	http://www.meetup.com/NYC-rb/events/223864932/ "NYC.rb"
[3]:	http://www.meetup.com/dcruby/events/225338026/ "DC Ruby User's Group"
[4]:	https://github.com/rossta/loves-enumerable
