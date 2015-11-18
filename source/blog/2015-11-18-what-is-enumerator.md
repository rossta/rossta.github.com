---
title: What the Heck is a Ruby Enumerator?
author: Ross Kaffenberger
summary: Exploring Ruby Enumerators for fun and profit
description: You may not be using enough of the Enumerable API or doing enough with Enumerator.
published: true
permalink: /2015/11/what-the-heck-is-a-ruby-enumerator/
tags:
  - Code
  - Ruby
---
Let's pretend we know about Ruby's Enumerable module - that it's included in
Ruby's core collection classes like Array and Hash and provides a bunch of
methods for traversal, searching and sorting, and that we can can introduce it
to plain old ruby classes through inclusion and implementing the `#each` method.
Check out this [dated - yet reliable - Enumerable primer](http://ruby.bastardsbook.com/chapters/enumerables/) if you'd like a refresher.

`Enumerator` is like `Enumerable's` kid sister; while `Enumerable` is getting
all the attention, `Enumerator`, having borrowed many traits of her sibling, can do lots of amazing things in her own way and really should get more credit. Well, it's time you took notice, Ma.

So what exactly is `Enumerator`?. For one, it's a class. You can instantiate an
instance of `Enumerator` by calling many of `Array#each` without a block:

```ruby
[1, 2, 3].each
=> #<Enumerator: [1, 2, 3]:each>
```

In fact, you can do this for many (but not all) of Array's `Enumerable` methods
that expect a block:

```ruby
[1, 2, 3].map
=> #<Enumerator: [1, 2, 3]:map>

[1, 2, 3].select
=> #<Enumerator: [1, 2, 3]:select>

[1, 2, 3].reduce
LocalJumpError: no block given
```

Okay, big deal. What does this get us? Glad you asked.

Instances of Enumerator are enumerable objects so you can call enumerable methods on them:

```ruby
e = [1, 2, 3].map
e.each { |n| p n }
1
2
3
=> [nil, nil, nil]
```

See what happened there? Notice how the expression printed out each digit, but returned `[nil, nil, nil]` instead of of `[1, 2, 3]`? The `Enumerator` implemented `map` in the context of `each`; since `p n` returns `nil`, we got three entries of `nil` in the return value. We chained the behavior of two enumerable methods.

Here's another example: Although we `Enumerable#each_with_index`, we don't have
`Enumerable#map_with_index`. But we can chain enumerators together to get what
is effectively the same result:

```ruby
e = [1, 2, 3].map
e.each_with_index { |n, i| n * i }
=> [0, 2, 6]
```

The block receives both each member of the original array along with its index
for each iteration. This usage is common enough, that `Enumerator` provides
`with_index` to give:

```ruby
e = [1, 2, 3].map.with_index { |n, i| n * i }
=> [0, 2, 6]
```

Reads pretty well, eh? What's really interesting here is that enumerators package
up knowledge of a collection and a method with which we want to enumerate.

We can combine several enumerators in different orders to get different
behaviors. Here's an nice example borrowed from [another recent post on the subject](http://dgiim.github.io/blog/2015/08/24/ruby-enumerators/#the-enumerator-class):

```ruby
letters = %w[a b c d e]

group_1 = letters.reverse_each.group_by.each_with_index do |item, index|
  index % 3
end

group_2 = letters.reverse_each.each_with_index.group_by do |item, index|
  index % 3
end

p group_1
=> {0=>["e", "b"], 1=>["d", "a"], 2=>["c"]}

p group_2
=> {0=>[["e", 0], ["b", 3]], 1=>[["d", 1], ["a", 4]], 2=>[["c", 2]]}
```

`Enumerator` provides some additional methods that allow for "external"
enumeration as well. With an enumerator instance, we can call `next` to get each
successive member of the collection.

Consider `Enumerable#cycle`. Calling "cycle" on an enumerable collection (without a limit arg) will enumerate over members of a collection ad nauseum. When implemented as an enumerator of css colors, we can use `cycle` to create striped table rows:

```ruby
Project = Struct.new(:name)

colors = ['aliceblue', 'ghostwhite'].cycle
projects = [Project.new("TODO"),
            Project.new("Work"),
            Project.new("Home")]

require 'erb'

erb = (<<-ERB)
<table>
<% projects.each_with_index do |project, index| %>
 <tr style="background: <%= colors.next %>">
   <td><%= index + 1 %></td>
   <td><%= project.name %></td>
 </tr>
<% end %>
</table>
ERB

p ERB.new(erb).result(binding).gsub(/^$\n/, "")

=> <table>
 <tr style="background: aliceblue">
   <td>1</td>
   <td>TODO</td>
 </tr>
 <tr style="background: ghostwhite">
   <td>2</td>
   <td>Work</td>
 </tr>
 <tr style="background: aliceblue">
   <td>3</td>
   <td>Home</td>
 </tr>
</table>
```

Brilliant! Notice how, in each enumeration of `project`, we're calling `colors.next`. So external enumeration is one technique for enumerating more than one collection at a time.

Not all enumerators will enumerate forever. Using cycle with a limit will result
in a `StopIteration` error:

```ruby
numbers = [1,2].cycle(1)
=> #<Enumerator: [1, 2]:cycle(1)>

numbers.next
# => 1

numbers.next
=> 2

numbers.next
StopIteration: iteration reached an end
```

The `loop` construct knows how to rescues from this error and treats it as a
`break`:

```ruby
numbers = [1,2].cycle(1)
=> #<Enumerator: [1, 2]:cycle(1)>

loop do
  p numbers.next
end

puts "Tada!"

1
2
=> nil

Tada!
=> nil
```

We can rewind enumerators or peek at their next values:

```ruby
e = [1, 2, 3].each

e.next
=> 1

e.peek
=> 2

e.next
=> 2

e.rewind
=> #<Enumerator: [1, 2, 3]:each>

e.next
=> 1
```

So enumerators have a few interesting methods and uses. In a future post, we'll
take a look at how to create our own enumerators outside of arrays and hashes and some good reasons for doing so.

In case you missed it, [check out my presentation in the previous post](blog/ruby-enumerable.html) on the `Enumerable` module.
