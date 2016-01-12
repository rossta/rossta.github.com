---
title: Debugging SystemStackError
author: Ross Kaffenberger
published: true
summary: Use Kernel tracing to inspect method Ruby method calls
description: Prior to Ruby 2.2, debugging stack overflow errors can be painful because most of the backtrace is swallowed in the output. Learn a quick workaround with Kernel.set_trace_func.
pull_image: 'https://rossta.net/assets/images/blog/stock/logs-pexels-photo.jpg'
tags:
  - Code
  - Ruby
---

Arrgggh. Ever come across this in your Ruby app?

```
SystemStackError: stack level too deep
    /Users/ross/dev/rossta/montrose/lib/montrose/options.rb:204
```

A `SystemStackError` occurs when your Ruby code encounters a stack overflow; in
other words, the memory allocated to execute the program exceeded the memory
available on the stack.

The most common cause of a stack overflow in application code that
recursively calls itself without terminating arguments: an infinite loop in your
code.

You can reproduce such an error with code like this in a terminal:

```bash
$ pry --noprompt
def foo
  foo
end
=> :foo
foo
SystemStackError: stack level too deep
from /Users/ross/.gem/ruby/2.1.6/gems/pry-0.10.3/lib/pry/pry_instance.rb:355
```

Note: for the examples in this post, assume I'm using Ruby 2.1 unless otherwise
indicated.

```bash
$ ruby -v
ruby 2.1.6p336 (2015-04-13 revision 50298) [x86_64-darwin14.0]
```

Prior to Ruby 2.2 and [this issue](https://bugs.ruby-lang.org/issues/6216), the
backtrace for `SystemStackError` was reduced to one line. That meant, unless
that one line lead you to an obvious culprit in your source code, it
would be very difficult to unravel the method calls causing the stack to overflow.

So, first step in debugging the `SystemStackError` is upgrade to Ruby 2.2!

In case that's not possible, there's still hope. Let's try using information
from the error first. Here's the method containing [the line in the backtrace](https://github.com/rossta/montrose/blob/e5b7a12f6832b4f971a52b27800cefe144ecd399/lib/montrose/options.rb#L204):

```ruby
# lib/montrose/options.rb:204

def map_arg(arg, &block)
  return nil unless arg

  Array(arg).map(&block)    # line 204
end
```

No obvious culprit. This method doesn't call itself and there are multiple callers
of this method in this class.

Let's try rescuing from the error in a test and printing the execution stack
using [`Kernel.caller`](http://ruby-doc.org/core-2.2.3/Kernel.html#method-i-caller). I can isolate the application code that produces the stack overflow in a single test and rescue there.

```ruby
it "a test" do
  # given

  begin
    # when
  rescue SystemStackError
    puts caller
  end

  # then
end
```

Here's what I get:

```bash
$ bin/m spec/rfc_spec.rb:426
/Users/ross/dev/rossta/montrose/spec/rfc_spec.rb:434:in `block (2 levels) in <top (required)>'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest/test.rb:108:in `block (3 levels) in run'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest/test.rb:205:in `capture_exceptions'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest/test.rb:105:in `block (2 levels) in run'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest/test.rb:256:in `time_it'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest/test.rb:104:in `block in run'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest.rb:334:in `on_signal'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest/test.rb:276:in `with_info_handler'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest/test.rb:103:in `run'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest.rb:781:in `run_one_method'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest.rb:308:in `run_one_method'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest.rb:296:in `block (2 levels) in run'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest.rb:295:in `each'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest.rb:295:in `block in run'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest.rb:334:in `on_signal'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest.rb:321:in `with_info_handler'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest.rb:294:in `run'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest.rb:155:in `block in __run'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest.rb:155:in `map'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest.rb:155:in `__run'
/Users/ross/.gem/ruby/2.1.6/gems/minitest-5.8.3/lib/minitest.rb:129:in `run'
/Users/ross/.gem/ruby/2.1.6/gems/m-1.4.2/lib/m/runners/minitest_5.rb:9:in `run'
/Users/ross/.gem/ruby/2.1.6/gems/m-1.4.2/lib/m/executor.rb:26:in `execute'
/Users/ross/.gem/ruby/2.1.6/gems/m-1.4.2/lib/m/runner.rb:17:in `run'
/Users/ross/.gem/ruby/2.1.6/gems/m-1.4.2/lib/m.rb:13:in `run'
/Users/ross/.gem/ruby/2.1.6/gems/m-1.4.2/bin/m:4:in `<top (required)>'
bin/m:16:in `load'
bin/m:16:in `<main>'
```

The backtrace points to lines in minitest. Since I've been running tests prior
to this isssue successfully, it's unlikely minitest is the source of the stack overflow error. So rescuing from `SytemStackError` doesn't help us either.

Luckily, we have [this gist](https://gist.github.com/jbgo/4493822) from
[@jbgo](https://github.com/jbgo) who highlighted a special feature in Ruby for
tracing function events: [`Kernel.set_trace_func`](http://ruby-doc.org/core-1.9.3/Kernel.html#method-i-set_trace_func).

Here's the example from the docs:

```ruby
class Test
  def test
    a = 1
    b = 2
  end
end

set_trace_func proc { |event, file, line, id, binding, classname|
  printf "%8s %s:%-2d %10s %8s\n", event, file, line, id, classname
}
t = Test.new
t.test

    line prog.rb:11               false
  c-call prog.rb:11        new    Class
  c-call prog.rb:11 initialize   Object
c-return prog.rb:11 initialize   Object
c-return prog.rb:11        new    Class
    line prog.rb:12               false
    call prog.rb:2        test     Test
    line prog.rb:3        test     Test
    line prog.rb:4        test     Test
  return prog.rb:4        test     Test
```

The method `set_trace_func` sets a global proc to be invoked in response to
runtime events including the following:

* `c-call` a C-language routine
* `c-return` return from a C-language routine
* `call` a Ruby method
* `class` start a class or module definition
* `end` finish a class or module definition
* `line` execute code on a new line
* `raise` raise an exception
* `return` return from a Ruby method

Since we want to isolate the Ruby method causing the infinite loop in our stack,
we'll log the line info for `call` events:

```ruby
# spec/spec_helper.rb

$trace_out = open("trace.txt")

set_trace_func proc { |event, file, line, id, binding, classname|
  if event == 'call'
    $trace_out.puts "#{file}:#{line} #{classname}##{id}"
  end
}
```

Re-running the test produces a `trace.txt` file that records all the Ruby method
calls encountered during execution. Inspecting this log, we hope to find a
repeating pattern of an identical list of method calls.

In my case, the start of each pattern pointed to another line in my source where
the stack originates:

```
/Users/ross/dev/rossta/montrose/lib/montrose/stack.rb:38 Montrose::Stack#advance
/Users/ross/dev/rossta/montrose/lib/montrose/frequency/yearly.rb:4 Montrose::Frequency::Yearly#include?
/Users/ross/dev/rossta/montrose/lib/montrose/frequency.rb:51 Montrose::Frequency#matches_interval?
...
/Users/ross/dev/rossta/montrose/lib/montrose/stack.rb:38 Montrose::Stack#advance
/Users/ross/dev/rossta/montrose/lib/montrose/frequency/yearly.rb:4 Montrose::Frequency::Yearly#include?
/Users/ross/dev/rossta/montrose/lib/montrose/frequency.rb:51 Montrose::Frequency#matches_interval?
...
/Users/ross/dev/rossta/montrose/lib/montrose/stack.rb:38 Montrose::Stack#advance
/Users/ross/dev/rossta/montrose/lib/montrose/frequency/yearly.rb:4 Montrose::Frequency::Yearly#include?
/Users/ross/dev/rossta/montrose/lib/montrose/frequency.rb:51 Montrose::Frequency#matches_interval?
...
```

A useful trick is to keep the trace routine in a separate file that you can
incorporate with an environment variable. You can also leverage `Kernel.caller`
here and only log when the stack exceeds an arbitrarily large size.

```ruby
# spec/support/trace.rb

if ENV["TRACE"]
  $stack_size = ENV["TRACE"].to_i
  $trace_out = open("trace.txt")

  set_trace_func proc { |event, file, line, id, binding, classname|
    if event == 'call' && caller.length > $stack_size
      $trace_out.puts "#{file}:#{line} #{classname}##{id}"
    end
  }
end
```

In my [Montrose](https://github.com/rossta/montrose) gem, [this file](https://github.com/rossta/montrose/blob/9600e0b63bde342011b3b9b1e29ab9f76f5f69c3/spec/support/trace.rb) gets loaded during every test run but the `set_trace_func` hook will
only be evaluated when the `TRACE` environment variable is present:

```
$ TRACE=500 bin/m spec/montrose/recurrence_spec.rb
```

Again, you'll more info from stack traces when you encounter this error in Ruby
2.2+ and above, but keep this in mind next time you get stuck "in the loop".
