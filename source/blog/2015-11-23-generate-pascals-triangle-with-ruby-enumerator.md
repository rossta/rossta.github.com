---
title: Generate Pascals Triangle with Ruby Enumerator
author: Ross Kaffenberger
published: false
---

Sequences need not be numbers either. Pascal’s Triangle, a favorite of mine, represents a [“triangular array of the binomial coefficients”]. We can model this in Ruby as an array of arrays. The first array member is `[1]`. Each successive array (or “row”) will increase in size, and each array member will be the sum of the member at the same index `n` in the `k-1` row, where `k` is the current row, and the `n-1` member in the `k-1` row or 0. In other words, add the number above and the number above to the left (or zero) to get the current number. We can express the first 5 rows as follows:

''[
''[1],
''[1, 1],
''[1, 2, 1],
''[1, 3, 3, 1],
''[1, 4, 6, 4, 1]
'']

Let’s solve this with Ruby. To be certain, there are a number of approaches to generating Pascal’s Triangle, including both recursive and iterative solutions, so consider the following as just one technique that emphasizes use of the Enumerable API.

Pascal’s Triangle is another infinite sequence where each item is a row. Starting with the first row, `[1]`, we can write a Ruby method that will generate the next row `[1, 1]`. Let’s write this in a way so it will be possible to generate any row `k` from row `k-1`. Here’s what the usage of this method will look like:

''pascal_row([1])
''=> [1, 1]
''pascal_row([1, 3, 3, 1])
''=> [1, 4, 6, 4, 1]

Let’s engineer how we’ll do this by deconstructing down this fifth row: `[1, 4, 6, 4, 1]`. Each member is the sum of `n` and `n-1` (or 0) from the previous row, `[1, 3, 3, 1]`. Therefore, we can rewrite the fifth row as

''[(0 + 1), (1 + 3), (3 + 3), (3 + 1), (1 + 0)]
''=> [1, 4, 6, 4, 1]

We could create that construct from a nested array of number pairs and collecting the sum of each pair like so:

''[[0, 1], [1, 3], [3, 3], [3, 1], [1, 0]].collect { |a, b| a + b }
''=> [1, 4, 6, 4, 1]

Look closely at those array pairs and we see a pattern. Take the first element
