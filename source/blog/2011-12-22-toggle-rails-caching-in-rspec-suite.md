---
title: Toggle Rails Caching in RSpec Suites
author: Ross Kaffenberger
thoughts: An RSpec helper for testing Rails caching in acceptance tests
permalink: /2011/12/toggle-rails-caching-in-RSpec-suite/
tags:
  - Code
  - Ruby
  - Rails
---
A useful feature of RSpec is the ability to pass metadata to tests and suites. You may already be familiar with examples in [Capybara][1], such as passing `:js` to enable the javascript driver for a given spec. You may reach a point in the maturity of your test suite when it makes sense add your own configuration options.

Once you introduce caching in your view layer, it can be easy for bugs to crop up around expiry logic. Since the Rails test environment ships with controller caching disabled, it may be useful to be able to toggle it on/off during the test run. To provide an optional caching mechanism for your specs, configure an around block:

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
describe "visit the homepage", :caching =\> true do
  \# test cached stuff
end
```

Happy testing.

[1]:	https://github.com/jnicklas/capybara
