---
title: How to Test Features with Rails Caching in RSpec
author: Ross Kaffenberger
summary: An RSpec helper for using Rails caching in acceptance tests
description: Learn how to use RSpec metadata to add declarative ways to toggle features like Rails caching during test runs
pull_image: 'blog/noun_6185_cc.png'
published: true
tags:
  - Code
  - Ruby
  - Rails
---
Once you introduce caching in your view layer, it can be easy for bugs to crop up around expiry logic. Since the Rails test environment ships with controller caching disabled, it may be useful to be able to toggle it on/off during the test run.

A useful feature of RSpec is the ability to pass metadata to tests and suites. You may already be familiar with examples in [Capybara][1], such as passing `:js` to enable the javascript driver for a given spec. You may reach a point in the maturity of your test suite when it makes sense add your own configuration options.

To provide an optional caching mechanism for your specs, configure an around block:

```ruby
RSpec.configure do |config|
  config.around(:each, :caching) do |example|
  caching = ActionController::Base.perform_caching
  ActionController::Base.perform_caching = example.metadata[:caching]
  example.run
  ActionController::Base.perform_caching = caching
  end
end
```

The around block takes the RSpec example object as an argument. The block is triggered when :caching is detected as a key in an example’s metadata. The example object provides a number of methods for test introspection, allowing you to make changes before and after calling run to execute the spec. Here, we are storing the previously set value of `ActionContoller::Base.perform_caching`, setting it for the local suite, and setting it back to the original value after it completes.

As a result, we now have a simple, explicit mechanism for introducing caching to individual specs and suites:

```ruby
describe "visit the homepage", :caching do
  # test cached stuff
end
```

Happy testing.

***

[SD Card](https://thenounproject.com/term/sd-card/6185/) by Thomas Le Bas from the Noun Project

[1]:	https://github.com/jnicklas/capybara

