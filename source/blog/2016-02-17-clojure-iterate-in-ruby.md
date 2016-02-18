---
title: Clojure's iterate in Ruby
author: Ross Kaffenberger
published: true
summary: To build sequences, use Enumerator
description: Implementing the Clojure sequence functions, iterate, with Ruby's Enumerator to emulate sequences
pull_image: 'https://rossta.net/assets/images/blog/stock/umbrella-pexels-photo.jpg'
series: Enumerable
tags:
  - Code
  - Ruby
  - Clojure
---

In functional languages, the key building blocks are functions and data. Clojure has a particularly interesting data structure, [sequences][1], not featured in the Ruby standard library. A Clojure sequence is an immutable collection that representing the result of an algorithm. Previously, I described how to generate Clojure-like [sequences in Ruby](https://rossta.net/blog/pascals-triangle-with-rubys-enumerator.html) (without the immutability anyways), including [Pascal's Triangle](https://rossta.net/blog/infinite-sequences-in-ruby.html) using `Enumerator`, which allows us to package up an algorithm as an object that can emit values as any "eager" collection can, like `Array` and `Hash`.

Clojure provides a few functions that can be used to generate sequences,
including `iterate`. According to the [docs](https://clojuredocs.org/clojure.core/iterate),

> `Returns a lazy sequence of x, (f x), (f (f x)) etc. f must be free of side-effects`

In other words, `iterate` will emit values starting with the first and repeatedly call the given function with the return value of the previous call.

The signature in Clojure looks this:

```clojure
(iterate f x)
```

So, we can generate a simple sequence of numbers using the `inc` function and some start value:

```clojure
=> (iterate inc 1)
(1 2 3 4 5 ...)
```

Of course, we have a terse was of generating a sequence like this in Ruby:

```ruby
irb(main)> (1..5).to_a
=> [1, 2, 3, 4, 5]
```

But this solution doesn't generalize to other types of sequences like, for instance,
generating a sequence of the powers of 2. In the example below, `(partial * 2)`
returns a function that multiplies a single argument by 2.

```clojure
=> (iterate (partial * 2) 1)
(1 2 4 8 16 32 64 128 ...)
```

To get this result in Ruby, we might try something like:

```ruby
irb> (1..7).each_with_object([]) { |n, seq| seq << (seq.last.nil? ? n : seq.last * 2) }
=> [1, 2, 4, 8, 16, 32, 64]
```

Not very pretty (ok, I admit that's a strawman). But this also is an "eagerly"
generated collection whereas we want something that can be lazily generated to
get closer to Clojure.

While there may be a number of ways to generate these sequences in Ruby, for this
exercise, we also want something that has a similar signature to Clojure's `iterate`,
like this:

```ruby
iterate(x, &block)
```

We'll leverage Ruby's method block convention in place of the function, `f`.
Usage would look like this:

```ruby
irb> iterate(1) { |n| n + 1 }
=> [1, 2, 3, 4, 5, ...]
irb> iterate(1) { |n| n * 2 }
=> [1, 2, 4, 8, 16, 32, 64, ...]
```

The two examples now have the same "surface area" and have a lot in common with the Clojure
companions. So how would we implement this?

First a test. By the way, all the code found in the following examples is [on Github](https://github.com/rossta/loves-enumerable/tree/master/examples/sequence).

```ruby
require 'minitest/autorun'
require_relative './sequence'

class TestSequence < Minitest::Test
  include Sequence

  def test_iterate_increment
    sequence = iterate(1) { |x| x + 1 }

    assert_equal sequence.first(5), [1, 2, 3, 4, 5]
  end
end
```

We're going to implement `iterate` in a Ruby module called `Sequence`. Our test
for `iterate` will return an instance of `Enumerator` (the `sequence` variable).
The enumerator allows use to generate the sequence on demand with the call to
`#first`.

Here's the implementation:

```ruby
module Sequence
  def iterate(arg)
    Enumerator.new do |yielder|
      current = arg
      loop do
        yielder << current
        current = yield(current)
      end
    end
  end
end
```

To implementation of `iterate` returns an `Enumerator` that will first yield
the given `arg` and repeatedly call the given block with the result of the
previous call. The `loop` construct means this enumeration can potentially
continue forever which does capture the spirit of a Clojure sequence. That means
we need to use terminating functions like `#first` or `#take` to limit the
results, just like we would in Clojure:

```clojure
=> (take 5 (iterate (partial * 2) 1))
(1 2 4 8 16)
```

The Ruby equivalent:

```ruby
iterate(1) { |n| n * 2 }.take(5)
=> [1, 2, 4, 8, 16]
```

We could go one step further an make this method work as a mixin. Below is a
test for using `iterate` as an instance method of a class using in our tests
that will simply delegate missing methods to the object passed in on
instantiation.

```ruby
class TestSequence < Minitest::Test
  include Sequence

  class Sequenced < SimpleDelegator
    include Sequence
  end

  def test_iterate_include
    num = Sequenced.new(0)

    sequence = num.iterate { |x| x - 1 }
    assert_equal sequence.first(5), [0, -1, -2, -3, -4]
  end
end
```

To make this pass, we need only set the default arg to `self`:

```ruby
module Sequence
  def iterate(arg = self)
    # ...
  end
end
```

So what? Ok, well, you may be hard pressed to use `iterate` in your daily work,
but there is certainly more room to think about data processing as functional
operations (free of side effects) on sequences (values that can be generated on demand). Something like `iterate` need not apply to only numbers; you can imagine sequences of letters, time objects, or POROs also being generated. At times, Rubyist are too quick to wrap collections in other classes when simpler, more generalizable "functional" transforms could suffice.

When I started [learning Clojure](http://devpost.com/software/learning-clojure) last year, I got really excited about the functional aspects of Ruby. "Wait, I thought everything in Ruby is an object." Yes, but a great thing about Ruby is its [ability to adopt aspects of other languages](http://yehudakatz.com/2009/07/11/python-decorators-in-ruby/). As Piotr Solnica illustrates in [his recent talk](https://speakerdeck.com/solnic/blending-functional-and-oo-programming-in-ruby), blending functional techniques with our OO code can have a lot of benefits including avoidance of side effects and favoring composability. Introducing sequence-generating methods, like we saw here, is just one small idea to help sprinkle a little functional flavor into your Ruby code.

[1]:  http://clojure.org/sequences
