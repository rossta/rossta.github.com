---
title: How to Write a Simple Web Crawler in Ruby - Revisited
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

We'll adapt Skork's original goals and provide a few of our own:

> * must be able to crawl just a single domain
> * must be able to limit number of pages to crawl (even with a depth limited crawl, might still have too many pages to get through depending on the starting set of domains)
> * the results should be structured (key,value pairs) so we don't have an incomprehensible soup of content
> * the results should be enumerable so we can have flexibility in how they're handled

Caveats! Please keep in mind that there are, of course, many resources for
using resilient, well-tested crawlers in a variety of languages. Our intentions
here are educational so we choose to ignore a few important concerns, such as
client side rendering and parallelism, as a matter of convenience.

### Breaking it down

For this exercise, we're going to crawl the [Programmable Web](http://www.programmableweb.com/) to extract data from their API directory.

Rather than take a naive approach by grabbing all the content from various pages
under the given domain, we're going to build a webcrawler that emits
structured data. Traversing from the site's root, http://programmable.com, our
crawler will visit web pages like a nodes of a tree and collect both data and
additional links to crawl.

Imagine results of our web crawl as a nested collection of
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

<aside>
When using a web crawler, be aware of the limitations described in the website's <a href="https://en.wikipedia.org/wiki/Robots_exclusion_standard">robots.txt</a> file. We're skipping automated parsing and detection of <a href="http://www.programmableweb.com/robots.txt">Programmable Web's robot.txt</a> in this post. We could do to filter out urls to crawl and set a delay to avoid overwhelming the target site. If you choose to run this code on your own, please crawl responsibly.
</aside>


### Designing the surface

If you've been following my posts lately, you know that [I love Enumerable](https://rossta.net/blog/ruby-enumerable.html) and [Enumerator](/blog/what-is-enumerator.html). Because we've specified we'd like to generate results as a collection, it should be possible to model the data with an enumerator. This will provide a familiar, flexible interface that can be adapted for logging, storage, transformation, and a wide range of use cases.

In short, I want to simply ask a `spider` object for its results and get back an enumerator:

```ruby
spider.results
=> #<Enumerator: ...>
```

With an enumerator, we'll be able to do some interesting things, like stream the
results lazily into a flexible storage engine, like MongoDB or `PStore`,
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

We're going to write a `Spider` class with a single public method, `#results`. Our spider implementation borrows heavily from [joeyAghion's spidey](https://github.com/joeyAghion/spidey) gem, described as a "loose framework for crawling and scraping websites". If you'd like to preview the full source of this example, check out the [spider][spider] in my enumerable examples repo.

Our `Spider` will maintain a set of urls, the results, and the "handlers" -
these will be method names invoked to process each url. We'll provide an
`#enqueue` method to put urls and their handlers onto the list
invoke (described in more detail later in this post). We'll take advantage of one external dependency, `mechanize`, to handle interaction with the pages we visit, extract data, resolve urls, follow redirects, etc.

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

Since our `Spider` will only know how to enumerate urls and record data, we'll introduce a collaborator object to contain the implementation for consuming data for a specific site. For now, we'll call this object a "processor" and it will respond to `#root` and `#handler` to be the first url and processing method to enqueue for the spider. We'll also provide options for enforcing limits on the number of pages to crawl and the delay between each request.

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

Now for the real meat of our young `Spider`. The `#results` method is responsible for enumerating over the enqueued urls and yields members of the `@results` collection as data is extracted from various webpages as they are "processed" by the processor.

```ruby
class Spider
  def results
    return enum_for(:results) unless block_given?

    index = @results.length
    enqueued_urls.each do |url, handler|
      # process page
      @processor.send(handler[:method], agent.get(url), handler[:data])
      if block_given? && @results.length > index
        yield @results.last
        index += 1
      end
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

I find it to be a more expressive way to enumerate an "eager" collection, like an array, that is changing in size.  Notice we're also returning an enumerator from `#results`:

```ruby
def results
  return enum_for(:results) unless block_given?
  # ...
end
```

This technique provides the method caller to more flexibility when determining
how to handler the results. While you could pass a block to consumer the
results, e.g., `spider.results { |r| puts r.inspect }`, this is an "eager"
operation. We'd have to wait for all the pages to be processed before continuing
with the block. With a hat tip to [Stop including Enumerable, return Enumerator
instead](http://blog.arkency.com/2014/01/ruby-to-enum-for-enumerator/), our
`Spider` class doesn't itself represent a collection so the use of an enum here
is better than including `Enumerable` and implementing `#each`.

### Processing

Our `Spider` is now functional, we can move onto the processor for `ProgrammableWeb` that will be
responsible for interacting with the spider instance and extracting data from
the pages it visits. As mentioned previously, our processor will need to
define a root url and initial handler method, for which defaults are provided. Our `ProgrammableWeb` will also be able to
instantiate a new spider with itself and expose the spiders `#results` method:

```ruby
class ProgrammableWeb
  attr_reader :root, :handler

  def initialize(root: "https://programmableweb.com/apis/directory", handler: :process_index)
    @root = root
    @handler = handler
  end

  def results(&block)
    spider.results(&block)
  end

  private

  def spider
    @spider ||= Spider.new(self)
  end
end
```

The rest of our `ProgrammableWeb` processor are handler methods that deserialize
a web page into additional urls and data to add to our collection of results.
Our spider will invoke the handlers as `@processor.send(method, agent.get(url), data)`, so each handler method will have the following signature, where `page` is an instance of `Mechanize::Page` ([docs](http://docs.seattlerb.org/mechanize/Mechanize/Page.html)) that provides a number of methods for interacting with html content:

```ruby
def handler_method(page, data = {})
  # enqueue urls and/or record data
end
```

So for example, `ProgrammableWeb#process_index` will extract api names in the
index list, enqueue api detail pages and additional, paginated indexes. As data
is collected, it may be passed on to handlers further down the tree via
`Spider#enqueue`.


```ruby
def process_index(page, data = {})
  page.links_with(href: /\?page=\d+/).each do |link|
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
  categories = page.search("article.node-api .tags").first.text.strip.split(/\s+/)
  fields = page.search("#tabs-content .field").each_with_object({}) do |tag, results|
    key = tag.search("label").text.strip.downcase.gsub(/[^\w]+/, ' ').gsub(/\s+/, "_").to_sym
    val = tag.search("span").text
    results[key] = val
  end

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

Modeling results from a multi-level page crawl as a collection may not work for every use case; for this exercise, it serves as a nice abstraction for enumerating data. It's arguable that this implementation is "simple", but there is great simplicity and flexibility in its usage.

To see the source of the full example:

What do you think of this approach ([full source][spider])?

[spider]: https://github.com/rossta/loves-enumerable/blob/master/examples/spider.rb
