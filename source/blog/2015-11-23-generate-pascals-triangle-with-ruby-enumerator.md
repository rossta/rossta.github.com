---
title: Generate Pascals Triangle with Ruby Enumerator
author: Ross Kaffenberger
published: false
---

Sequences need not be numbers either. Pascal’s Triangle, a favorite of mine, represents a [“triangular array of the binomial coefficients”]. We can model this in Ruby as an array of arrays. The first array member is `[1]`. Each successive array (or “row”) will increase in size, and each array member will be the sum of the member at the same index `n` in the `k-1` row, where `k` is the current row, and the `n-1` member in the `k-1` row or 0. In other words, add the number above and the number above to the left (or zero) to get the current number. We can express the first 5 rows as follows:

```ruby
[
  [1],
  [1, 1],
  [1, 2, 1],
  [1, 3, 3, 1],
  [1, 4, 6, 4, 1]
]
```

Let’s solve this with Ruby. To be certain, there are a number of approaches to generating Pascal’s Triangle, including both recursive and iterative solutions, so consider the following as just one technique that emphasizes use of the Enumerable API.

Pascal’s Triangle is an infinite sequence where each item is a row. Starting with the first row, `[1]`, we can write a Ruby method that will generate the next row `[1, 1]`. Let’s write this in a way so it will be possible to generate any row `k` from row `k-1`. Here’s what the usage of this method will look like:

```ruby
pascal_row([1])
=> [1, 1]
pascal_row([1, 3, 3, 1])
=> [1, 4, 6, 4, 1]
```

We'll use Test-Driven Development to validate our implementation starting with a
few assertions to ensure the first several rows are returned as expected.

```ruby
require 'minitest/autorun'

def pascals_row(row)
end

class TestPascalsTriangle < Minitest::Test
  def test_pascals_row
    assert_equal [1, 1], pascals_row([1])
    assert_equal [1, 2, 1], pascals_row([1, 1])
    assert_equal [1, 3, 3, 1], pascals_row([1, 2, 1])
    assert_equal [1, 4, 6, 4, 1], pascals_row([1, 3, 3, 1])
    assert_equal [1, 5, 10, 10, 5, 1], pascals_row([1, 4, 6, 4, 1])
  end
end
```

```ruby
$ ruby pascals_triangle_test.rb
Run options: --seed 45117

# Running:

F

Finished in 0.001035s, 966.0380 runs/s, 966.0380 assertions/s.

  1) Failure:
TestPascalsTriangle#test_pascals_row [code/pascals_row_test.rb:8]:
Expected: [1, 1]
  Actual: nil

1 runs, 1 assertions, 1 failures, 0 errors, 0 skips
```

To extract a general method, let’s deconstruct a single row. We'll examine the fifth: `[1, 4, 6, 4, 1]`. Each member is the sum of `n` and `n-1` from the previous row, `[1, 3, 3, 1]`. We substitute zero when `n` or `n-1` is missing. Therefore, we can rewrite the fifth row as

```ruby
[(0 + 1), (1 + 3), (3 + 3), (3 + 1), (1 + 0)]
=> [1, 4, 6, 4, 1]
```

We could create that construct from a nested array of number pairs and collecting the sum of each pair like so:

```ruby
[[0, 1], [1, 3], [3, 3], [3, 1], [1, 0]].collect { |a, b| a + b }
=> [1, 4, 6, 4, 1]
```

Look closely at those array pairs for a pattern. Taking just first members of each pair form the array we get `[0, 1, 3, 3, 1]`. The second members of each pair are `[1, 3, 3, 1, 0]`. In each we see the members of row four, `[1, 3, 3, 1]` augmented by prepending zero or appending zero respectively.

This step is perfect for the `Enumerable#zip` method: `zip` groups members of given arrays by position. Therefore, we can use `zip` to combine `[0, 1, 3, 3, 1]` with `[1, 3, 3, 1, 0]` to produce `[[0, 1], [1, 3], [3, 3], [3, 1], [1, 0]]`:

[0, 1, 3, 3, 1].zip([1, 3, 3, 1, 0])
=> [[0, 1], [1, 3], [3, 3], [3, 1], [1, 0]]

Let's extract a variable to represent row four:

```ruby
row = [1, 3, 3, 1]
([0] + row).zip(row + [0])
=> [[0, 1], [1, 3], [3, 3], [3, 1], [1, 0]]
```

Putting it altogether, we can now produce the fifth row from the fourth:

```ruby
row = [1, 3, 3, 1]
([0] + row).zip(row + [0]).collect { |a, b| a + b }
=> [1, 4, 6, 4, 1]
```

Let's confirm this expression works with for other row conversions:

```ruby
row = [1]
([0] + row).zip(row + [0]).collect { |a, b| a + b }
=> [1, 1]

row = [1, 1]
([0] + row).zip(row + [0]).collect { |a, b| a + b }
=> [1, 2, 1]

row = [1, 2, 1]
([0] + row).zip(row + [0]).collect { |a, b| a + b }
=> [1, 3, 3, 1]
```

Yes! We now have the implementation for our method to produce any row for Pascal's Triangle given the preceding row:

```ruby
def pascal_row(row)
  ([0] + row).zip(row + [0]).collect { |a, b| a + b }
end
```

Plugging this implementation into our test:

```ruby
require 'minitest/autorun'

def pascals_row(row)
  ([0] + row).zip(row + [0]).collect { |a, b| a + b }
end

class TestPascalsTriangle < Minitest::Test
  def test_pascals_row
    assert_equal [1, 1], pascals_row([1])
    assert_equal [1, 2, 1], pascals_row([1, 1])
    assert_equal [1, 3, 3, 1], pascals_row([1, 2, 1])
    assert_equal [1, 4, 6, 4, 1], pascals_row([1, 3, 3, 1])
    assert_equal [1, 5, 10, 10, 5, 1], pascals_row([1, 4, 6, 4, 1])
  end
end
```

... we get passing tests

```
$ ruby code/pascals_row_test.rb
Run options: --seed 61039

# Running:

.

Finished in 0.001020s, 980.6882 runs/s, 4903.4412 assertions/s.

1 runs, 5 assertions, 0 failures, 0 errors, 0 skips
```
