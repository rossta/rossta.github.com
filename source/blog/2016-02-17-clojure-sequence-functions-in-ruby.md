---
title: Clojure's iterate in Ruby
author: Ross Kaffenberger
published: false
summary: Implementing Clojure's iterate in Ruby
description: Implementing the Clojure sequence functions, iterate, in Ruby
pull_image: 'https://rossta.net/assets/images/blog/stock/umbrella-pexels-photo.jpg'
series: Enumerable
tags:
  - Code
  - Ruby
  - Clojure
---

In functional languages, the key building blocks are functions and data. Clojure has a particularly interesting data structure, [sequences][1], not featured in the Ruby standard library. A Clojure sequence in Clojure is an immutable collection that represents the output of an algorithm. Previously, I described how to generate Clojure-like [infinite sequences](https://rossta.net/blog/pascals-triangle-with-rubys-enumerator.html) (without the immutability anyways), including [Pascal's Triangle as a sequence](https://rossta.net/blog/infinite-sequences-in-ruby.html) using Ruby's `Enumerator`. The key traits of a sequence are found in `Enumerator`: we can package up an algorithm as an object that can emit values as any "eager" collection can, like `Array` and `Hash`.

Clojure provides a few functions that can be used to generate sequences,
including `iterate`. According to the [docs](https://clojuredocs.org/clojure.core/iterate),

> `Returns a lazy sequence of x, (f x), (f (f x)) etc. f must be free of side-effects`

In other words, `iterate` will emit values starting with the first and repeatedly call the given function with the return value of the previous call.

The signature in Clojure looks this:

```clojure
(iterate f x)
```

So, we can generate a simple sequence of numbers increasing by one using the `inc` function and some start value:

```clojure
=> (iterate inc 3)
(3 4 5 6 7 8 ...)
```

Of course, we have a terse was of generating a sequence like this in Ruby:

```ruby
irb(main)> (3..8).to_a
=> [3, 4, 5, 6, 7, 8]
```

But this doesn't generalize to other operations.

To implement `iterate` in Ruby, we will use a block in place of the function, `f`. Our Ruby signature will look like this:

```ruby
iterate(x, &block)
```



Let's implement `iterate` in Ruby.



When I started [learning Clojure](http://devpost.com/software/learning-clojure) last year, I got really excited about the functional aspects of Ruby. "Wait, I thought everything in Ruby is an object." Yes, but a great thing about Ruby is its [ability to adopt aspects of other languages](http://yehudakatz.com/2009/07/11/python-decorators-in-ruby/). As Piotr Solnica illustrates in [his recent talk](https://speakerdeck.com/solnic/blending-functional-and-oo-programming-in-ruby), blending functional techniques with our OO code can have a lot of benefits including avoidance of side effects and favoring composability. Introducing sequence-generating methods, like we saw here, is just one small idea to help sprinkle a little functional flavor into your Ruby code.

[1]:  http://clojure.org/sequences
