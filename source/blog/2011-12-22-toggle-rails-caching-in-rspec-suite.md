---
title: Toggle Rails Caching in RSpec Suites
author: rossta
permalink: /2011/12/toggle-rails-caching-in-rspec-suite/
categories:
  - Performance
  - Ruby
---
A useful feature of RSpec is the ability to pass metadata to tests and suites and configure the test environment according. For example, [Capybara][1] provides :js options to enable the javascript driver for a given spec. Another use case for RSpec metadata is to test the effects of Rails caching in requests.

 [1]: https://github.com/jnicklas/capybara

The Rails test environment ships with controller caching disabled, which you might not prefer. Otherwise, it may be useful to be able to toggle it on/off during the test run. To provide an optional caching mechanism for your specs, configure an around block:

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

The around block takes the RSpec example object as an argument. The block is triggered when :caching is detected as a key in an example’s metadata. The example object provides a number of methods for test introspection, allowing you to make changes before and after calling #run to execute the spec. Here, we are storing the previously set value of ActionContoller::Base.perform_caching, setting it for the local suite, and setting it back to the original value after it completes.

As a result, we now have a simple, explicit mechanism for introducing caching to individual specs and suites:

```ruby
describe "visit the homepage", :caching => true do
  # test cached stuff
end
```

