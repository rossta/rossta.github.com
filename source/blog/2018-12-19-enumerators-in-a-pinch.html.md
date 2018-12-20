---
title: Enumerators in a pinch
author: Ross Kaffenberger
published: false
summary: Enhance block methods with to_enum
description: This post describes how to make enumerable methods that use blocks to iterate over an internal data structures but don't their enumerable properties and why this would be useful.
pull_image: 'blog/stock/louvre-pexels-photo.jpg'
series: Enumerable
category: Code
tags:
  - Rails
  - Ruby
---

In Ruby, some methods expect a block as a callback yielding elements of some internal data structure.

Imagine a method `paginated_results` on some `client` object that yields individual pages.
```ruby
client.paginated_results(params) { |page| puts page.contents }
```
The method may hide away some complexity in retrieving pages.
```ruby
def paginated_results(params = {})
  before  = nil
  max     = 1000
  limit   = 50
  results = []

  loop do
    page = fetch_page(params.merge(before: before, limit: limit)) # imaginary request

    results += page

    yield page

    break if results.length >= max

    before = page.last["id"]
  end
end
```
Being Ruby, we may expect to be able to call `Enumerable` methods on the underlying data structure to inspect, slice, or augment the data in a convenient way.

But, sometimes, especially if we're using a method from an external library, we may not have access to method's internals and the underlying data structure. This is the case with our `paginated_results` example; the `results` array is not exposed to the method caller.

To use enumerable logic on the data from a method like this, a common approach I see is to build up state from the outside:
```ruby
pages = []

client.paginated_results(order: :asc) { |p| pages << p }

pages.map.with_index { |p, i| [p.contents.size, i] }
# etc
```
We have another option in Ruby: we can "enumeratorize" it!

Ruby's `to_enum` method is defined on all objects. Quite simply, it can convert a method into `Enumerator`:
```ruby
client.to_enum(:paginated_results, params)
# => <Enumerator ...>
```
What this gives us is an enumerable object that behaves as if we built up that array ourselves, which means we can call methods from the `Enumerable` module, chain other enumerators to augment the block arguments, use `lazy`, etc.
```ruby
client.to_enum(:paginated_results, params).map.with_index { |p, i| "#{p.title}:#{i}" }
```
In fact, this pattern is so useful that many authors have started building in `to_enum` to such methods for when the caller omits the block. The implementation for `paginated_results` might look like this:
```ruby
def paginated_results(params = {})
  return to_enum(__method__, params) unless block_given?

  # rest unchanged
end
```
I ran into this problem recently with the Rails API for `ActiveSupport::Cache` and its `fetch_multi` method ([doc](https://api.rubyonrails.org/classes/ActiveSupport/Cache/Store.html#method-i-fetch_multi)). This method allows the caller to read values for multiple keys in one pass, while providing a mechanism to write missing data through a block that passes the individual key for each cache miss:
```ruby
Rails.cache.fetch_multi("key_1", "key_2", "key_3") { |key| get_value_elsewhere(key) }
```
To warm the Rails cache for a collection of ActiveRecord data, I wanted the index of each key to call into a batch of objects. Since the `fetch_multi` doesn't return an `Enumerator` when the block is omitted, I "enumeratorized" it:
```ruby
Permalink.find_in_batches do |batch|
  keys = batch.map { |link| "cache_key_for_link:#{link.id}" }

  Rails.cache.to_enum(:fetch_multi, *keys).with_index do |key, index|
    batch[index].code
  end
end
```
Even with the workaround, I made a [pull request to Rails](https://github.com/rails/rails/pull/34757) in hopes of making `fetch_multi` enumerator compatible.

In conclusion, when you're in a punch, you can use `to_enum` to wrap iterative methods to add otherwise missing `Enumerable` properties. And, when designing your classes, consider adopting the `return to_enum(__method__) unless block_given?` pattern in method definitions to enhance iterative methods.
