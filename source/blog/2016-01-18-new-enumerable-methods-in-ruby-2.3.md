---
title: New Enumerable methods in Ruby 2.3
author: Ross Kaffenberger
published: false
summary: New Enumerable methods in Ruby 2.3
description: New Enumerable methods in Ruby 2.3
pull_image: 'https://rossta.net/assets/images/blog/stock/dark-brown-milk-candy-pexels-photo.jpg'
series: Enumerable
tags:
  - Code
  - Ruby
  - Enumerable
---

You may have heard [Ruby 2.3 dropped](https://www.ruby-lang.org/en/news/2015/12/25/ruby-2-3-0-released/) on Christmas this past year. Two new `Enumerable` instance methods were added, `grep_v` and `chunk_while` and each are variations on enumerable methods we already had. We'll dissect both here below.

### Inverted grep

#### Before you can grep, you must triple equals

Grep allows you to select members of a collection that match an expression. That expression is `some_object === item`.

What does "triple equals" do? Well, in Ruby, as in most languages, that answer
is complicated. Since we can define this method however we want in our own
classes, it can mean anything. But, most commonly:

> if `a` === `b`, then `b` is a subset of `a`

How about a few examples.

```ruby
Symbol === :foo   # => true, :foo is a symbol
String === "foo"  # => "foo", is a string
Symbol === "foo"  # => "foo", is not a symbol
String === :foo   # => :foo, is not a string

/foo/ === "foobar" # => true, "foobar" matches /foo/
(1..10) === 2       # => true, 2 is in the range 1..10
```

We **could** use `select` to filter out items of a collection with the `===` like
so:

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

Define `===` on any class or object to take advantage of filtering with `grep` and `grep_v` in other contexts.

### Enumerating in Chunks

The `Enumerable` module provides several methods for enumerating adjacent
members of a collection, including `slice_when`, `slice_before`, `slice_after`,
`each_cons`, and, not surprisingly, `chunk`. Ruby 2.3 offers yet another
chunking method, `chunk_while`. Let's examine some uses of these chunking
methods.

For the following examples, we'll enumerate over recurring events given by the
`Montrose` gem. Montrose provides an api for create recurrences which we can use
as enumerators.

Here's a recurrence that will enumerate over every other Tuesday
starting today.

```ruby
require "montrose"

r = Montrose.every(:day, on: :tuesday, interval: 2)

r.take(4).to_a
=> [2016-01-26 09:15:36 -0500,
 2016-02-09 09:15:36 -0500,
 2016-02-23 09:15:36 -0500,
 2016-03-08 09:15:36 -0500]
```

We'll use recurrences to illustrate some chunking.
`slice_when` enumerates adjacent pairs and emits a chunk every time the block
evaluates to true:

make test-all TESTS=

#### Chunk
#### Group By
#### Chunk while three ways


