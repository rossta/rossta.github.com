---
title: How to write a simple web crawler in Ruby - revisited
author: Ross Kaffenberger
published: true
summary: Crawling websites and streaming structured data with Ruby's Enumerator
description: Bringing a fresh perspective and Ruby's Enumerator to revisit an old post on using Ruby to write a simple web crawler
pull_image: 'https://rossta.net/assets/images/blog/stock/spider-web-pexels-photo.jpg'
series: Enumerable
tags:
- Code
- Ruby
---

![Web Crawl](blog/stock/spider-web-pexels-photo.jpg)

Let's build a simple web crawler in Ruby. For inspiration, I'd like to
to revisit [Alan Skorkin's How to Write a Simple Web Crawler in Ruby](http://www.skorks.com/2009/07/how-to-write-a-web-crawler-in-ruby/) and attempt to achieve something similar with a fresh perspective.

We'll adapt Skork's original goals and provide a few of our own:

> * must be able to crawl just a single domain
> * must be able to limit number of pages to crawl
> * the results should be represented as structured data so we don't have an incomprehensible soup of content
> * the results should be enumerable so we can have flexibility in how they're handled

<aside class="callout panel">
<p>
  Caveats! Please keep in mind that there are, of course, <a href="http://webscraper.io/">many</a> <a href="http://scrapy.org/">resources</a> for
  using resilient, well-tested <a href="https://www.import.io/">crawlers</a> in a variety of languages. We have mere academic intentions
  here so we choose to ignore many important concerns, such as client-side rendering, parallelism, and handling failure, as a matter of convenience.
</p>
</aside>

### Breaking it down

For this exercise, we're going to crawl [Programmable Web](http://www.programmableweb.com/) to extract data from their [API directory](http://www.programmableweb.com/apis/directory).

Rather than take the naive approach of grabbing all content from any page, we're going to build a webcrawler that emits
structured data. Traversing from the first page of the api directory, our
crawler will visit web pages like a nodes of a tree, collecting data and
additional urls along the way.

Imagine that the results of our web crawl as a nested collection of
hashes with meaningful key-value pairs.

```ruby
# results
[
  {
    name: "Google Maps",
    api_provider: "https://google.com"
    api_homepage: "https://developers.google.com/maps/"
    categories: ["Mapping", "Viewer"],
    provider_formats: ["JSON", "KML", "XML"]
    ...
  },
  {
    name: "Twitter",
    api_provider: "https://twitter.com"
    api_homepage: "https://dev.twitter.com/rest/public"
    categories: ["Social", "Blogging"],
    provider_formats: ["Atom", "JSON", "REST", "RSS", "XML"]
    ...
  },
]
```

<aside class="callout panel">
<p>
  When using a web crawler, be aware of the limitations described in the website's <a href="https://en.wikipedia.org/wiki/Robots_exclusion_standard">robots.txt</a> file. In this post, we skip automated parsing and detection of <a href="http://www.programmableweb.com/robots.txt">Programmable Web's robots.txt</a> to filter out blacklisted urls and set a crawl delay dynamically. If you choose to run this code on your own, please crawl responsibly.
</p>
</aside>

### Designing the surface

If you've been following my posts lately, you know that [I love Enumerable](https://rossta.net/blog/ruby-enumerable.html) and you may not be surprised that I'd like to model our structured, website data with an [Enumerator](/blog/what-is-enumerator.html). This will provide a familiar, flexible interface that can be adapted for logging, storage, transformation, and a wide range of use cases.

I want to simply ask a `spider` object for its results and get back an enumerator:

```ruby
spider.results
=> #<Enumerator: ...>
```

We'll be able to do some interesting things, like stream the
results lazily into a flexible storage engine, e.g. [mongodb](https://www.mongodb.org/) or `PStore`,
available from the [Ruby standard library](http://ruby-doc.org/stdlib-2.3.0/libdoc/pstore/rdoc/PStore.html):

```ruby
require "pstore"
store  = PStore.new("api_directory.pstore")

# create `spider`, then ...

spider.results.lazy.take(50).each_with_index do |result, i|
  store.transaction do
    store[result[:name]] = result
    store.commit
  end
end
```

### Writing the crawler

We're going to write a `Spider` class to enumerate website data. Our spider implementation borrows heavily from [joeyAghion's spidey](https://github.com/joeyAghion/spidey) gem, described as a "loose framework for crawling and scraping websites" and Python's venerable [Scrapy](http://scrapy.org/) project, which allows you to scrape websites "in a fast, simple, yet extensible way." Both resources achieve the goals of being easy-to-use and extensible.

We'll build our web crawler piece-by-piece, but if you want a full preview of the source, check out it [on GitHub][spider].

Our `Spider` will maintain a set of urls to visit, data is collects, and a set of url "handlers" that will describe how each page should be processed. We'll take advantage of one external dependency, `mechanize`, to handle interaction with the pages we visit - to extract data, resolve urls, follow redirects, etc. Below is the `#enqueue` method to add urls and their handlers to a running list in our spider.

```ruby
require "mechanize" # as of this writing, the latest release is 2.7.4

class Spider
  def enqueue(url, method)
    url = agent.resolve(url).to_s
    return if @handlers[url]
    @urls << url
    @handlers[url] ||= { method: method, data: {} }
  end

  private

  def agent
    @agent ||= Mechanize.new
  end
end
```

As we process each page we'll need a way to record the structured data we extract from various pages. We'll expose a `#record` method append a hash of data to the `@results` array.

```ruby
class Spider
  def record(data = {})
    @results << data
  end
end
```

Since our `Spider` will only know how to enumerate urls and record data, we'll introduce a collaborator object to contain the implementation for consuming data for a specific site. For now, we'll call this object a "processor". The processor will respond to the messages `#root` and `#handler` - the first url and handler method to enqueue for the spider, respectively. We'll also provide options for enforcing limits on the number of pages to crawl and the delay between each request.

```ruby
class Spider
  REQUEST_INTERVAL = 5
  MAX_URLS = 1000

  def initialize(processor, attrs = {})
    @processor = processor

    @urls     = []
    @results  = []
    @handlers = {}

    @interval = attrs.fetch(:interval, REQUEST_INTERVAL)
    @max_urls = attrs.fetch(:max_urls, MAX_URLS)

    enqueue(processor.root, processor.handler)
  end
end
```

### Enumerator Two Ways

Now for the real meat of our young `Spider`. The `#results` method is the key public interface: it enumerates the enqueued urls and yields members of the `@results` collection.

```ruby
class Spider
  def results
    return enum_for(:results) unless block_given?

    index = @results.length
    enqueued_urls.each do |url, handler|

      # process url
      @processor.send(handler[:method], agent.get(url), handler[:data])

      if block_given? && @results.length > index
        yield @results.last
        index += 1
      end

      # crawl delay
      sleep @interval if @interval > 0
    end
  end

  private

  def enqueued_urls
    Enumerator.new do |y|
      index = 0
      while index < @urls.count && index <= @max_urls
        url = @urls[index]
        index += 1
        next unless url
        y.yield url, @handlers[url]
      end
    end
  end
end
```

An interesting thing to note is that the size of our url queue and the collected results may be growing as we crawl more pages. For the `#enqueued_urls` private method, we're using an `Enumerator` to wrap the logic for iterating over the list of `@urls` and maintaining state, like the `index`. The `Enumerator` class is well-suited to represent a lazily generated collection.

```ruby
def enqueued_urls
  Enumerator.new do |y|
    # ...
  end
end
```

I find it to be a more expressive way to indicate we're enumerating values "on demand" as opposed to "eagerly", like a typical collection.

Notice we're also returning an enumerator from `#results`:

```ruby
def results
  return enum_for(:results) unless block_given?
  # ...
end
```

This technique provides the method caller to more flexibility when determining
how to handler the results. While you could pass a block to consume the
results, e.g., `spider.results { |r| puts r.inspect }`, this is an eager
operation. We'd have to wait for all the pages to be processed before continuing
with the block. Returning an enumerator offers the potential to stream results
to something like a data store.

Why not include `Enumerable` in our `Spider` and implement `#each` instead? As pointed out in [Arkency's Stop including Enumerable, return Enumerator
instead](http://blog.arkency.com/2014/01/ruby-to-enum-for-enumerator/), our
`Spider` class doesn't itself represent a collection, so exposing the `#results`
method as an enumerator is more appropriate.

### From Soup to Net Results

Our `Spider` is now functional so we can move onto the details of extracting data from an actual website.

Our processor, `ProgrammableWeb` will be responsible for wrappin a `Spider` instance and extracting data from
the pages it visits. As mentioned previously, our processor will need to
define a root url and initial handler method, for which defaults are provided, and delegate the `#results` method to a `Spider` instance:

```ruby
class ProgrammableWeb
  attr_reader :root, :handler

  def initialize(root: "https://www.programmableweb.com/apis/directory", handler: :process_index, **options)
    @root = root
    @handler = handler
    @options = options
  end

  def results(&block)
    spider.results(&block)
  end

  private

  def spider
    @spider ||= Spider.new(self, @options)
  end
end
```

`ProgrammableWeb` will define handler methods that deserialize a web page into additional urls and data to add to our collection of results.
Our spider will invoke the handlers (as seen above with `@processor.send(method, agent.get(url), data)`). Each handler method will have the following signature

```ruby
def handler_method(page, data = {})
  # enqueue urls and/or record data
end
```

... where `page` is an instance of `Mechanize::Page` ([docs](http://docs.seattlerb.org/mechanize/Mechanize/Page.html)) providing a number of methods for interacting with html content:

The root handler method, `ProgrammableWeb#process_index`, will extract api names in the
index list, enqueue api detail pages and additional, paginated indexes. As data
is collected, it may be passed on to handlers further down the tree via
`Spider#enqueue`.

```ruby
def process_index(page, data = {})
  page.links_with(href: %r{\?page=\d+}).each do |link|
    spider.enqueue(link.href, :process_index)
  end

  page.links_with(href: %r{/api/\w+$}).each do |link|
    spider.enqueue(link.href, :process_api, name: link.text)
  end
end
```

To process api detail pages, we'll define a separate handler. Since these pages
will represent "leaves" in this exercise, we'll merge the data passed in with
that extracted from the page and pass it along to `Spider#record`.

```ruby
def process_api(page, data = {})
  fields = page.search("#tabs-content .field").each_with_object({}) do |tag, o|
    key = tag.search("label").text.strip.downcase.gsub(%r{[^\w]+}, ' ').gsub(%r{\s+}, "_").to_sym
    val = tag.search("span").text
    o[key] = val
  end

  categories = page.search("article.node-api .tags").first.text.strip.split(/\s+/)

  spider.record data.merge(fields).merge(categories: categories)
end
```

As we saw earlier, recorded data is emitted in the `Spider#results` method.

Now we can make use of our `ProgrammableWeb` crawler as intended with simple
instantiation and the ability to enumerate results as a stream of data:

```ruby
spider = ProgrammableWeb.new

spider.results.lazy.take(5).each_with_index do |result, i|
  puts "%-3s: %s" % [i, result.inspect]
end

# 0 : {:name=>"Facebook", :api_provider=>"http://facebook.com", :api_endpoint=>"http://api.facebook.com/restserver.php", :api_homepage=>"https://developers.facebook.com/", :primary_category=>"Social", :secondary_categories=>"Webhooks", :protocol_formats=>"JSON, REST", :ssl_support=>"Yes", :api_kits=>"http://developers.facebook.com/documentation.php?doc=clients", :api_forum=>"http://forum.developers.facebook.com/", :twitter_url=>"http://twitter.com/fbplatform", :developer_support=>"http://developers.facebook.com/group.php?gid=2205007948", :console_url=>"http://developers.facebook.com/tools/explorer", :authentication_mode=>"API Key, OAuth 2, Username/password", :categories=>["Social", "Webhooks"]}
# 1 : {:name=>"LinkedIn", :api_provider=>"http://www.linkedin.com/", :api_endpoint=>"http://api.linkedin.com/v1/", :api_homepage=>"https://developer.linkedin.com/docs", :primary_category=>"Social", :secondary_categories=>"Enterprise", :protocol_formats=>"JSON, JSONP, REST, XML", :other_options=>"JavaScript", :ssl_support=>"Yes", :api_forum=>"https://developer.linkedin.com/forum", :twitter_url=>"https://twitter.com/linkedindev", :console_url=>"http://developer.linkedinlabs.com/jsapi-console/#examples/login/simple.html&{&quot;framework&quot;:&quot;platform.linkedin.com/in.js&quot;,&quot;frameworkurl&quot;:&quot;&quot;,&quot;apikey&quot;:&quo", :authentication_mode=>"OAuth 2", :categories=>["Social", "Enterprise"]}
# 2 : {:name=>"Skype", :api_provider=>"http://skype.com", :api_endpoint=>"http://skype.com", :api_homepage=>"http://www.skype.com/en/developer/", :primary_category=>"Telephony", :secondary_categories=>"Chat, Messaging, Video, Voice", :protocol_formats=>"Unspecified", :other_options=>"Skype proprietary", :ssl_support=>"Yes", :api_kits=>"https://developer.skype.com/Docs/Web https://developer.skype.com/wiki/Java_API", :api_forum=>"http://forum.skype.com/index.php?showforum=16", :developer_support=>"http://forum.skype.com/index.php?showforum=16", :authentication_mode=>"Unspecified", :categories=>["Telephony", "Chat,", "Messaging,", "Video,", "Voice"]}
# 3 : {:name=>"Twitter", :api_provider=>"http://twitter.com", :api_endpoint=>"http://twitter.com/statuses/", :api_homepage=>"https://dev.twitter.com/rest/public", :primary_category=>"Social", :secondary_categories=>"Blogging", :protocol_formats=>"Atom, JSON, REST, RSS, XML", :ssl_support=>"No", :api_kits=>"ActionScript", :api_forum=>"http://groups.google.com/group/twitter-development-talk", :twitter_url=>"http://twitter.com/twitterapi", :contact_email=>"api@twitter.com", :console_url=>"https://dev.twitter.com/console", :authentication_mode=>"OAuth 2, HTTP Basic Auth, OAuth", :categories=>["Social", "Blogging"]}
# 4 : {:name=>"YouTube", :api_provider=>"http://www.google.com", :api_endpoint=>"http://gdata.youtube.com/feeds/", :api_homepage=>"https://developers.google.com/youtube/", :primary_category=>"Video", :secondary_categories=>"Media", :protocol_formats=>"Atom, RSS, JSON, XML, GData", :other_options=>"Atom Publishing Protocol (Atom/RSS)", :ssl_support=>"No", :api_kits=>"Java, PHP Python, Ruby, ActionScript", :api_forum=>"http://groups.google.com/group/youtube-api/", :twitter_url=>"https://twitter.com/YouTubeDev/", :developer_support=>"http://code.google.com/support/bin/topic.py?topic=12357", :console_url=>"http://code.google.com/apis/ajax/playground/?exp=youtube#simple_embed", :authentication_mode=>"OAuth2", :categories=>["Video", "Media"]}
```

### Wrapping up

I admit, it's arguable that this implementation is "simple". Skorks provided a straightforward, recursive solution to consume unstructured content. Our approach is iterative and requires some work up front to define which links to consume and how to process them with "handlers". However, we were able to achieve an extensible, flexible tool with a nice separation of concerns and a familiar, enumerable interface.

Modeling results from a multi-level page crawl as a collection may not work for every use case, but, for this exercise, it serves as a nice abstraction for collecting data. It would now be trivial to take our `Spider` class and implement a new processor for a site like [rubygems.org](https://rubygems.org) or [craigslist](https://craigslist.org) and stream the results to a database like [Redis](http://redis.io) or [`YAML::Store`](http://ruby-doc.org/stdlib-2.3.0/libdoc/yaml/rdoc/YAML/Store.html).

Try it yourself and let me know what you think of this approach ([full source][spider]).

[spider]: https://github.com/rossta/loves-enumerable/blob/master/examples/spider.rb
