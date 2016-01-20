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

The `Enumerable` module provides a `chunk_while`

#### Chunk
#### Group By
#### Chunk while three ways


