---
title: "What's new in Ruby 2.3 Enumerable"
author: Ross Kaffenberger
published: true
summary: A closer look at Enumerable's grep_v and chunk_when
description: Ruby 2.3 introduced a couple new additions to the Enumerable API that provide some nice variations on existing methods
pull_image: 'blog/stock/dark-brown-milk-candy-pexels-photo.jpg'
series: Enumerable
category: Code
tags:
  - Ruby
---

You may have heard [Ruby 2.3 dropped](https://www.ruby-lang.org/en/news/2015/12/25/ruby-2-3-0-released/) on Christmas this past year. Two new `Enumerable` instance methods were added, `grep_v` and `chunk_while`, both of which are variations on other `Enumerable` methods. We'll dissect both here below.

#### Triple Lindey

Grep allows you to select members of a collection that match an expression. That expression is `some_object === item`.

What does "triple equals" do? Well, in Ruby, as in most languages, that answer is complicated. Since we can define this method however we want in our own classes, it can mean anything. But, most commonly, it is a loose way of asking whether an object belongs to a certain group:

> if `a` === `b`, then `b` is a subset of `a`

A few examples:

```ruby
Symbol === :foo     # => true, :foo is a symbol
String === "foo"    # => true, "foo" is a string
Symbol === "foo"    # => false, "foo" is not a symbol
String === :foo     # => false, :foo is not a string

/foo/ === "foobar"  # => true, "foobar" matches /foo/
(1..10) === 2       # => true, 2 is in the range 1..10
```

We *could* use `select` to filter out items of a collection with the `===` like so:

```ruby
1.upto(20).select { |i| (6..10) === i } # => [6, 7, 8, 9, 10]
```

But this is what `grep` is for:

```ruby
1.upto(10).grep(6..8) # => [6, 7, 8]
```

So `grep` is like saying "gimme all the items in the given set".

To get all the items *not* included, use `grep_v`:

```ruby
1.upto(10).grep_v(6..8)
=> [1, 2, 3, 4, 5, 9, 10]
```

It's probably most likely that you'd use `grep` and `grep_v` with a regular expression, like
to select all the months that end in "er":

```ruby
MONTHS.grep(/er$/)
=> ["September", "October", "November", "December"]
```

Define `===` on any class or object to take advantage of filtering with `grep` and `grep_v` in other contexts.

#### Chunking

The `Enumerable` module provides several methods for enumerating adjacent
members of a collection, including `slice_when`, `slice_before`, `slice_after`,
`each_cons`, and, not surprisingly, `chunk`. Ruby 2.3 offers yet another
chunking method, `chunk_while`.

Before diving into `chunk_while`, let's look at its relatives, `chunk` and `slice_when`.

For the following examples, we'll enumerate over recurring events given by the
`Montrose` gem. Montrose provides an api to create recurrences as enumerators.

Here's a recurrence that will enumerate over every other Tuesday at noon.

```ruby
require "montrose"

r = Montrose.every(2.weeks, on: :tuesday, at: '12pm')

r.take(10).to_a
=> [2016-02-02 12:00:00 -0500,
 2016-02-16 12:00:00 -0500,
 2016-03-01 12:00:00 -0500,
 2016-03-15 12:00:00 -0400,
 2016-03-29 12:00:00 -0400,
 2016-04-12 12:00:00 -0400,
 2016-04-26 12:00:00 -0400,
 2016-05-10 12:00:00 -0400,
 2016-05-24 12:00:00 -0400,
 2016-06-07 12:00:00 -0400]
```

For calendaring, it may be useful to split this array into chunks by month.

We could use `group_by` to return a hash of month numbers to Tuesday time
instances:

```ruby
r.take(10).group_by(&:month)
=> {2=>[2016-02-02 12:00:00 -0500, 2016-02-16 12:00:00 -0500],
 3=>[2016-03-01 12:00:00 -0500, 2016-03-15 12:00:00 -0400, 2016-03-29 12:00:00 -0400],
 4=>[2016-04-12 12:00:00 -0400, 2016-04-26 12:00:00 -0400],
 5=>[2016-05-10 12:00:00 -0400, 2016-05-24 12:00:00 -0400],
 6=>[2016-06-07 12:00:00 -0400]}
```

The `chunk` method is similar to `group_by` as it will divide the collection
into groups based on the given block/proc except it returns an enumerator
instead of a hash:

```ruby
r.take(10).chunk(&:month)
=> #<Enumerator: ...>
```

I recently [described some great things you can do with enumerators in Ruby](/blog/what-is-enumerator.html) including transforming the result of chunk into an array of month, time pairs:

```ruby
r.take(10).chunk(&:month).to_a
=> [[2, [2016-02-02 12:00:00 -0500, 2016-02-16 12:00:00 -0500]],
 [3, [2016-03-01 12:00:00 -0500, 2016-03-15 12:00:00 -0400, 2016-03-29 12:00:00 -0400]],
 [4, [2016-04-12 12:00:00 -0400, 2016-04-26 12:00:00 -0400]],
 [5, [2016-05-10 12:00:00 -0400, 2016-05-24 12:00:00 -0400]],
 [6, [2016-06-07 12:00:00 -0400]]]
```

Interestingly enough, passing the previous result to `Hash[]` returns the same
result we got with `group_by`:

```ruby
Hash[r.take(10).chunk(&:month).to_a]
=> {2=>[2016-02-02 12:00:00 -0500, 2016-02-16 12:00:00 -0500],
 3=>[2016-03-01 12:00:00 -0500, 2016-03-15 12:00:00 -0400, 2016-03-29 12:00:00 -0400],
 4=>[2016-04-12 12:00:00 -0400, 2016-04-26 12:00:00 -0400],
 5=>[2016-05-10 12:00:00 -0400, 2016-05-24 12:00:00 -0400],
 6=>[2016-06-07 12:00:00 -0400]}
```

If we just wanted the groups of times, not the month keys, we could ask for the
`group_by` values:

```ruby
r.take(10).group_by(&:month).values
=> [[2016-02-02 12:00:00 -0500, 2016-02-16 12:00:00 -0500],
 [2016-03-01 12:00:00 -0500, 2016-03-15 12:00:00 -0400, 2016-03-29 12:00:00 -0400],
 [2016-04-12 12:00:00 -0400, 2016-04-26 12:00:00 -0400],
 [2016-05-10 12:00:00 -0400, 2016-05-24 12:00:00 -0400],
 [2016-06-07 12:00:00 -0400]]
```

We can replace this computation with `slice_when` which will allow us to compare
adjacent members to determine "when" to start a new slice (or chunk). That means
the block we pass to `slice_when` accepts two arguments, the current and
previous collection member, and should return true or false. In this
case, we want a new slice to start when the month of the previous time does not
match the month of the current time as we enumerate:

```ruby
r.take(10).slice_when { |a, b| a.month != b.month }.to_a
=> [[2016-02-02 12:00:00 -0500, 2016-02-16 12:00:00 -0500],
 [2016-03-01 12:00:00 -0500, 2016-03-15 12:00:00 -0400, 2016-03-29 12:00:00 -0400],
 [2016-04-12 12:00:00 -0400, 2016-04-26 12:00:00 -0400],
 [2016-05-10 12:00:00 -0400, 2016-05-24 12:00:00 -0400],
 [2016-06-07 12:00:00 -0400]]
```

Note the return value of `slice_when` is an enumerator like we saw with `chunk`.

It turns out, the most common use cases of `slice_when` tend to be negative
comparisons, i.e., "slice when the previous thing is not the same as the current
thing". Since this is Ruby after all, wouldn't you prefer to stay positive?

Which brings us to `chunk_while`. Ruby 2.3 introduces this positive complement to
`slice_when` so we can say, "keep the same chunk if the current thing *does*
match the previous thing".

Back to our Tuesday recurrences. Let's replace `slice_when` with `chunk_while`:

```ruby
r.take(10).chunk_while { |a, b| a.month == b.month }.to_a
=> [[2016-02-02 12:00:00 -0500, 2016-02-16 12:00:00 -0500],
 [2016-03-01 12:00:00 -0500, 2016-03-15 12:00:00 -0400, 2016-03-29 12:00:00 -0400],
 [2016-04-12 12:00:00 -0400, 2016-04-26 12:00:00 -0400],
 [2016-05-10 12:00:00 -0400, 2016-05-24 12:00:00 -0400],
 [2016-06-07 12:00:00 -0400]]
```

So in short, `Enumerable` in Ruby 2.3 gives us both a negative and a positive variation, `grep_v` and `chunk_while` respectively, on existing methods.

---

Looking for a way to handle recurring events in your app? Be sure to check out [Montrose](https://github.com/rossta/montrose).
