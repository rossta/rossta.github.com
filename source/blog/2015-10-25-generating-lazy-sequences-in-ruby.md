---
title: Generating Infinite Sequences in Ruby
author: Ross Kaffenberger
summary: Understanding and applying Ruby's Enumerator
description: Using Ruby's Enumerator to generate lazy and infinite sequences
published: false
---

I've been playing around with Clojure quite a bit lately. I also like writing Ruby and one of its great powers is the ability to adopt or emulate features built into other languages. Thus, it hasn't taken long for me to start thinking about Clojure concepts I can use in Ruby code.

Clojure offers lazy sequences which have the ability to iterate over and consumer members of an infinite series of values, such as all natural numbers between one and forever.

We can already do this in Ruby and in 2.0, when the `Enumerator#lazy` method
was introduced, Rubyists have been able to generate the equivalent of Clojure's lazy sequences more easily. Pat Shaugnessy excellently describes the language features that in make this possible [Ruby 2.0 Works Hard So You Can Be Lazy](http://patshaughnessy.net/2013/4/3/ruby-2-0-works-hard-so-you-can-be-lazy).

So how do we get to use this in Ruby? Here's a common example:

```
$ ruby -v
ruby 2.2.2p95 (2015-04-13 revision 50295) [x86_64-darwin14]
$ gem install pry
$ pry
```

```ruby
range = 1..Float::INFINITY
# => 1..Infinity
range.map { |x| x+x }.first(5)
# infinite loop
range.lazy.map { |x| x+x }.first(5)
# => [2, 4, 6, 8, 10]
```

Since Ruby `Range` implements `Enumerable`, we can call `Range#lazy` and evaluate only the items we want which, in this case, is the first 10. This works because the last method in the chain, `Range#first`, determines the flow of execution and prevents the lazy enumeration from going into an infinite loop.

So, this works for infinite Ruby ranges, but how else can we generate lazy
sequences? How about from array?

```ruby
[1, 1, 2, 3, 5, 8, 13, 21, 34, 55].lazy.first(5)
# => [1, 1, 2, 5, 8]
```

Well, not so fast. The result was what we expected, but we have the details
wrong; this wasn't lazy because the array is eagerly evaluated. Readers may
recognize the Fibonacci sequence which is well-suited for a lazy implementation. Ranges won't help us here; we'll need to introduce a technique for evaluating an algorithm that produces members of the sequence lazily.

For inspiration, I'll turn back to Clojure and the `iterate` function. Here is the signature in Clojure:

```
(iterate f x)
```

The function accepts two arguments, `f` and `x`, where `f` is a function and `x` is an initial value and it returns a lazy sequence of `x, f(x), f(f(x))` and so on. So given an initial value, the function will be called repeated with its own return value, which will work well when the argument and return value are of the same type.

So let's implement `iterate` in Ruby where we can use a block in place of the
Clojure function argument:

```ruby
def iterate(x, &f)
  # magic
end
```

The `iterate` function will return an enumerable, so it will respond to methods like `each` and `first`. We'll provide it through our module `Iterable`. Let's start with a test.

```ruby
# iterable_test.rb
require 'minitest/autorun'
require './iterable'

class IterableTest < Minitest::Test
  include Iterable

  def test_increment
    sequence = iterate(1) { |x| x + 1 }

    assert_equal sequence.first(5), [1, 2, 3, 4, 5]
  end

  def test_decrement
    sequence = iterate(0) { |x| x - 1 }

    assert_equal sequence.first(5), [0, -1, -2, -3, -4]
  end
end

# iterable.rb
module Iterable
  def iterate(initial_arg, &block)
  end
end
```

```bash
$ ruby iterable_test.rb
Run options: --seed 30012

# Running:

EE

Finished in 0.000939s, 2129.0456 runs/s, 0.0000 assertions/s.

  1) Error:
TestIterable#test_decrement:
NoMethodError: undefined method `first' for nil:NilClass
    iterable_test.rb:16:in `test_decrement'

  2) Error:
TestIterable#test_increment:
NoMethodError: undefined method `first' for nil:NilClass
    iterable_test.rb:10:in `test_increment'

2 runs, 0 assertions, 0 failures, 2 errors, 0 skips
```

To get the behavior we want, we'll want to call the block repeatedly with the
return value of the previous call, starting with the initial argument. To
implement the magic, we'll turn to Ruby's
[Enumerator](http://ruby-doc.org/core-2.2.0/Enumerator.html). The docs can be
difficult to understand, so let's take a closer at what an enumerator is and how
we can use it.

An enumerator is an object that can iterate or yield values one by one. We get
an enumerator when we call `Array#each` without a block argument.

```ruby
enum = [1, 2, 3].each
# => #<Enumerator: [1, 2, 3]:each>
```

A useful method on enumerators is `Enumerator#next`, which pretty much does what
it says until it can't and throws an error.

```ruby
enum.next
# => 1
enum.next
# => 2
enum.next
# => 3
enum.next
# StopIteration: iteration reached an end
```

So the contents of arrays determine the behavior of their enumerators. But wait, there's more. We can create custom enumerators with `Enumerator::new`, a block, and a special "yielder" object.

```ruby
enum = Enumerator.new do |y|
  y << 1
  y << 2
  y << 3
end

enum.next
# => 1
enum.next
# => 2
enum.next
# => 3
enum.next
# StopIteration: iteration reached an end
```

That `y` we used is the "yielder", an instance of `Enumerator::Yielder`. You won't find much info on `Enumerator::Yielder` in the [docs](http://ruby-doc.org/core-2.2.0/Enumerator/Yielder.html) - which are incomplete at the time of this writing - but the yielder gives us a yield method (aliased to `#<<`), to feed blocks we give the enumerator later.

```ruby
enum.map { |x| x ** 2 }
# => [1, 4, 9]
```

We can enumerate infinitely with a `loop` construct:

```ruby
enum = Enumerator.new do |y|
  loop do
    y << "love"
  end
end

enum.each { |word| puts word }
# love forever
```

We can use enumerators to generate the Fibonacci sequence. Remember that iterate will return an enumerator which itself implements `Enumerable` and gives us access to functions we're familiar with from interacting with Ruby arrays and hashes.

```ruby
fib = Enumerator.new do |y|
  a = b = 1
  loop do
    y << a
    b, a = a + b, b
  end
end

fib.first(10)
# => [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
```

Turning back to our implementation of `iterate`, we'll want to keep track of
the current value which will be used to pass to each successive evaluation of the given block.

```ruby
module Iterable
  def iterate(inital_arg, &block)
    current = inital_arg
    loop do
      current = block.call current # x = f(x)
    end
  end
end
```

```bash
$ ruby iterable_test.rb
Run options: --seed 27701

# Running:

..

Finished in 0.000996s, 2008.1107 runs/s, 2008.1107 assertions/s.

2 runs, 2 assertions, 0 failures, 0 errors, 0 skips
```

Our `iterate` function is simple but powerful. We can use it as a building
block for other sequences.

```ruby
# Powers of two
iterate(1) { |n| n * 2 }.first(10)
# => [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]

# aaaaaaa
iterate("a") { |a| a + "a" }.first(5)
=> ["a", "aa", "aaa", "aaaa", "aaaaa"]

# Fibonacci again
fib = iterate([0, 1]) { |a, b| [b, a + b] }

fib.first(10).map(&:first)
=> [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

With Fibonacci from `iterate`, the seed argument is an array so that the
repeated calls can interact with multiple values. The enumerator spits out a
sequence of arrays which we map to the first item to produce the Fibonacci
numbers.

Another favorite of mine is [Pascal's
Triangle](https://en.wikipedia.org/wiki/Pascal%27s_triangle) where each cell of
each row is the sum of the adjacent cells in the previous row.

```bash
# Row 1: [1]
#
# Row 2: [1, 1]
#
#   0 1
# + 1 0
#   ---
#   1 1
#
# Row 3: [1, 2, 1]
#
#   0 1 1
# + 1 1 0
#   -----
#   1 2 1
```

Let's package this up in a class called `PascalsTriangle` which will give us
`rows` as an enumerator.

```ruby
# pascals_triangle_test.rb
require 'minitest/autorun'
require './pascals_triangle'

class PascalsTriangleTest < Minitest::Test
  def setup
    @pascal = PascalsTriangle.new
  end

  def test_additional_rows_default
    rows = @pascal.rows
    assert_equal [1], rows.next
    assert_equal [1, 1], rows.next
    assert_equal [1, 2, 1], rows.next
    assert_equal [1, 3, 3, 1], rows.next
    assert_equal [1, 4, 6, 4, 1], rows.next
    assert_equal [1, 5, 10, 10, 5, 1], rows.next
  end
end

# pascals_triangle.rb
class PascalsTriangle
  def rows
  end
end
```

```bash
$ ruby pascals_triangle_test.rb
Run options: --seed 59278

# Running:

E

Finished in 0.001018s, 982.7720 runs/s, 0.0000 assertions/s.

  1) Error:
TestPascalsTriangle#test_additional_rows_default:
NoMethodError: undefined method `next' for nil:NilClass
    pascals_triangle_test.rb:11:in `test_additional_rows_default'

1 runs, 0 assertions, 0 failures, 1 errors, 0 skips
```

Okay, we'll give `iterate` the first row as `[1]` and a block which will determine the next row from the preceding one. We'll zip the contents of two array formed by concatenated [0] to either end of previous row.

```ruby
row = [1]
zipped = ([0] + row).zip(row + [0])
# => [[0, 1], [1, 0]]
```

Then we'll sum the contents of the sub-arrays to form a single row of numbers:

```ruby
zipped.map { |a, b| a + b }
# => [1, 1]
```

Putting it all together in condensed form, we can use this as the basis for
Pascal's Triangle with `iterate`:

```ruby
require './iterable'

class PascalsTriangle
  include Iterable

  def rows(first = [1])
    iterate(first) do |row|
      ([0] + row).zip(row + [0]).map { |a, b| a + b }
    end
  end
end
```

```bash
$ ruby pascals_triangle_test.rb
Run options: --seed 129

# Running:

.

Finished in 0.000934s, 1070.9860 runs/s, 6425.9163 assertions/s.

1 runs, 6 assertions, 0 failures, 0 errors, 0 skips
```

For fun, here's our triangle in action on the console:

```ruby
pascal = PascalsTriangle.new
puts pascal.rows.first(5).map(&:inspect)
# [1]
# [1, 1]
# [1, 2, 1]
# [1, 3, 3, 1]
# [1, 4, 6, 4, 1]
```

We can write a custom enumerator for the sum of squares where we want to
iterate over natural numbers and emit the sum of all previous squares.

```ruby
Enumerator.new do |y|
  n = s = 0
  loop do
    y << s
    n += 1
    s += n ** 2
  end
end
```

or with the [derived formula](http://www.trans4mind.com/personal_development/mathematics/series/sumNaturalSquares.htm):

```ruby
Enumerator.new do |y|
  n = s = 0
  loop do
    y << s
    n += 1
    s = n * (n + 1) * (2 * n + 1)) / 6
  end
end
```

So, infinite sequences are great and may help on Project Euler or an interview,
but we also have work to do.
