This warning comes with good reason: handling multi-threaded concurrency in Ruby
is hard. Most Rubyist use the default Ruby implementation, MRI, which implements
the Global-Interpreter-Lock which prevents more than one thread running at any one time,
but it doesn't make any guarantees about thread-safety.

When code isn't thread-safe, it *might* cause data in memory to be incorrect without raising an error -
the kind of problem that can be hard to debug or reproduce. Most of us are too busy
pushing out new features for Rails apps to justify taking on the low-level challenges
that come with implementing and debugging multi-threaded code. Maybe this is
okay, but the side-effect of this mentality is many Rubyists never take the time
to learn more deeply about the pros and cons of multi-threaded concurrency.

It doesn't have to be this way.

Some of the most important Ruby libraries in the Rails ecosystem, like [Puma](), [ActiveRecord](),
[Sidekiq]() and [ActionCable]() embrace concurrency. To go further, try reading through the source
code of concurrency-abstraction libraries like [celluloid]() and
[concurrent-ruby]() or checking out Jesse Storimer's [Working with Ruby Threads](http://www.jstorimer.com/products/working-with-ruby-threads).

