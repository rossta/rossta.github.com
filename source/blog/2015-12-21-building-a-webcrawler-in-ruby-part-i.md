---
title: How to write a simple web crawler in Ruby revisted
author: Ross Kaffenberger
published: false
summary: Using Ruby's Enumerable to enumerate website page data
description: Using Ruby's Enumerable to enumerate website page data
pull_image: 'https://rossta.net/assets/images/blog/stock/aerial-highway-nightime-bangkok.jpg'
series: Enumerable
tags:
- Code
- Ruby
---

Let's build a simple web crawler in Ruby. As a point of inspiration, I wanted
to revisit [Alan Skorkin's How to Write a Simple Web Crawler in Ruby](http://www.skorks.com/2009/07/how-to-write-a-web-crawler-in-ruby/). As Skorks points out, a nice use case for a web crawler may be to collect data to import into another web application as the basis for a basic search engine. I'll be borrowing the goals he presented in that post and share how I might approach the same problem today.

Restating Skork's goals for the web crawler:

> * should be able to crawl the web (basic general functionality)
> * must be able to limit the depth of the crawl (otherwise will potentially keep going for ever and will also run out of memory eventually because of the way it’s written)
> * must be able to limit number of pages to crawl (even with a depth limited crawl, might still have too many pages to get through depending on the starting set of domains)
> * must be able to crawl just a single domain (you would also be able to limit this by number of pages)
> * the only output it will produce is to print out the fact that it is crawling a url

Caveats! Please keep in mind that there are, of course, many resources for
using resilient, well-tested crawlers in a variety of languages. Our intentions
here are educational so we choose to ignore a few important concerns, such as
client side rendering and parallelism, as a matter of convenience.

### Breaking it down

For this exercise, we're going to crawl the [Programmable Web](http://www.programmableweb.com/) to extract data from their API directory.

Rather than take a naive approach by grabbing all the content from various pages
under the given domain, we're going to build a webcrawler that emits
structured data. Traversing from the site's root, http://programmable.com, our
crawler will visit web pages in breadth-first order

Imagine the output of our web crawl as a nested collection of
hashes with meaningful key-value pairs.

<aside>
When using a web crawler, be aware of the limitations described in the website's <a href="https://en.wikipedia.org/wiki/Robots_exclusion_standard">robots.txt</a> file. We're skipping automated parsing and detection of <a href="http://www.programmableweb.com/robots.txt">Programmable Web's robot.txt</a> in this post so if you choose to run this code on your own, please crawl responsibly.
</aside>


### Designing the surface

* Enumerable - familiar API
* Laziness - ability to optimize
* Flexibility - persisting data example

### Writing the crawler

* Preparing the framework
* Capturing URLs with "infinite" enumerator
* Cliff hanger

### Letting it go

* Capturing URLs with "infinite" enumerator
* Respecting delays
* Yielding data
* Storing results

If you've been following my posts lately, you know that [I love Enumerable](https://rossta.net/blog/ruby-enumerable.html) and [Enumerator](/blog/what-is-enumerator.html). Modeling results from a multi-level as a collection may not work for every use case, but for this exercise, it serves as a nice abstraction for enumerating data. The solution is adapted from joeyAghion's [spidey](https://github.com/joeyAghion/spidey) gem, described as a "loose framework for crawling and scraping websites". Check it out.

What do you think of this approach? Share your comments below.

- http://www.programmableweb.com/api/ebay/source-code
