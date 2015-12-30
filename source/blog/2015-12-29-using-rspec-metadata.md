---
title: Using RSpec Metadata
author: Ross Kaffenberger
published: true
summary: Control spec behavior with declarative tags... just don't overdo it
description: Leveraging RSpec metadata to control how specs are run with examples for altering database mode and toggling behavior based on spec directory
pull_image: 'https://rossta.net/assets/images/blog/stock/fall-leaves-pexels-photo.jpg'
tags:
  - Code
  - Ruby
  - Rails
  - RSpec
---

A useful feature of RSpec is the ability to pass metadata to tests and suites.

You may already be familiar with how [Capybara](https://github.com/jnicklas/capybara) uses the `:js` option to enable the javascript driver.

```ruby
describe "a javascript feature", :js do
  # tests run against the Capyabara.javascript_driver
end
```

Capybara [provides an RSpec configuration hook](https://github.com/jnicklas/capybara/blob/957c35f580b68e8a140b5bbe7818fdcf06bc4521/lib/capybara/rspec.rb#L27) that changes the web driver for any example where `:js` metadata is present. Here it is, oversimplified:

```ruby
# capybara/rspec.rb
RSpec.configure do |config|
  config.before do
    Capybara.current_driver = Capybara.javascript_driver if example.metadata[:js]
  end
end
```

We may reach a point in the maturity of our test suite when it makes sense add our own configuration options.

<aside class="callout panel">
<p>
The examples in the post are based on rspec version <code>~> 3</code>.
</p>
</aside>

### Changing Test Runner Behavior

Testing libraries like RSpec and Capybara do some heavy lifting to set up the
Rails environment and make it suitable for running in test mode. For performance
reasons, it may be beneficial to run each of our specs in a database
transaction so test data can be easily rolled back at the start of each spec.

Here's a common base configuration for using the popular [DatabaseCleaner](https://github.com/DatabaseCleaner/database_cleaner) gem to
set up transactional database behavior for RSpec:

```ruby
RSpec.configure do |config|
  config.use_transactional_fixtures = false

  config.before(:suite) do
    DatabaseCleaner.clean_with(:truncation)
    DatabaseCleaner.strategy = :transaction
  end

  config.before(:each) do
    DatabaseCleaner.start
  end

  config.after(:each) do
    DatabaseCleaner.clean
  end
end
```

Not all specs can be run this way - once we add a javascript acceptance specs, for
example, the javascript driver will likely need its own connection to the
database so it won't have access to data setup in the tests. We need to run
javascript acceptance specs in *truncation* mode to ensure database changes are
committed to the database so multiple database connections will have access to the same data.

Let's use RSpec metadata to toggle database behavior automatically when using
the javascript driver (i.e., not the default `:rack_test` driver). We'll add the
following hooks, borrowed from the DatabaseCleaner [README](https://github.com/DatabaseCleaner/database_cleaner/tree/f32abebc4f28faa6ff944c4d1d4fee3f21ceb0bb#rspec-example):

```ruby
# spec/spec_helper.rb
config.before(:each, type: :feature) do
  # :rack_test driver's Rack app under test shares database connection
  # with the specs, so continue to use transaction strategy for speed.
  driver_shares_db_connection_with_specs = Capybara.current_driver == :rack_test

  if !driver_shares_db_connection_with_specs
    # Driver is probably for an external browser with an app
    # under test that does *not* share a database connection with the
    # specs, so use truncation strategy.
    DatabaseCleaner.strategy = :truncation
  end
end
```

We also run into problems with ActiveRecord `after_commit` callbacks - when running
tests in transaction mode, these callbacks will never fire. We can also
add an option for enabling truncation mode outside of acceptance specs when
isolated specs are needed for these callbacks:

```ruby
# spec/model/user_spec.rb
it "triggers background job after creating new user", :truncation_mode do
  # test after_commit callback
end

# spec/spec_helper.rb
config.before(:each, :truncation_mode) do
  DatabaseCleaner.strategy = :truncation
end
```

Here's a consolidated configuration for providing hooks for the issues related
to database truncation mentioned above:

```ruby
# spec/spec_helper.rb
RSpec.configure do |config|
  config.use_transactional_fixtures = false

  config.before(:suite) do
    DatabaseCleaner.clean_with(:truncation)
  end

  config.before(:each) do
    DatabaseCleaner.strategy = :transaction
  end

  config.before(:each, type: :feature) do
    driver_shares_db_connection_with_specs = Capybara.current_driver == :rack_test

    if !driver_shares_db_connection_with_specs
      DatabaseCleaner.strategy = :truncation
    end
  end

  config.before(:each, :truncation_mode) do
    DatabaseCleaner.strategy = :truncation
  end

  config.before(:each) do
    DatabaseCleaner.start
  end

  config.after(:each) do
    DatabaseCleaner.clean
  end
end
```

### Changing Application Settings

Rails provides a number of settings that can be easily configured based on the
environment, so we don't do undesired work in development or test environments,
such as sending emails. For any mature Rails application, we'll likely have
our own custom settings layered on top of the Rails defaults.

There are many cases where we'll still want to test the "production" settings in
our test environments.  For example, by default, controller caching is disabled in tests:

```ruby
# config/initializers/test.rb
Rails.application.configure do
  # ...
  config.action_controller.perform_caching = false

end
```

For selected acceptances specs, we may still want to test behavior of caching at
the view layer, say that users can see new info when a model attribute changes. We don't need this caching behavior is all test, so it may be useful to toggle specs on/off during the test run.

#### First attempt

We could try to "stub" the setting in the context of a single spec run with the "enabled" state.

```ruby
# spec/spec_helper.rb
RSpec.configure do |config|
  config.before(:each, :caching) do
    allow_any_instance_of(ActionController::Base).to receive(:perform_caching).and_return true
  end

  config.after(:each, :caching) do
    Rails.cache.clear
  end
end
```

This may require changing behavior of instances which is [typically discouraged](https://relishapp.com/rspec/rspec-mocks/docs/working-with-legacy-code/any-instance). We may also need to clean up other global state, like clearing the Rails cache after the test run.

#### Better attempt

Alternatively, we can set the actual values on while settings are derived.
Here's how it might look for enabling controller caching with an `around` block:

```ruby
# spec/spec_helper.rb
RSpec.configure do |config|
  config.around(:each, :caching) do |example|
    caching = ActionController::Base.perform_caching
    ActionController::Base.perform_caching = example.metadata[:caching]

    example.run

    Rails.cache.clear
    ActionController::Base.perform_caching = caching
  end
end
```

The `around` block takes the RSpec example object as an argument. When running specs, the given block is triggered when `:caching` is detected as a key in an example’s metadata. The example object provides a number of methods for test introspection, allowing us to make changes before and after calling run to execute the spec.

As a result, we now have a simple, explicit mechanism for introducing caching to individual specs and suites:

```ruby
# spec/features/homepage_spec.rb
describe "visit the homepage", :caching do
  it "expires cache" do
    # test cached stuff
  end
end
```

The main concern with this approach is that modifying a global state can affect
other tests unintentionally - a big no-no.

To avoid this, **we need to reset the original value when the example completes**.

Here, we are storing the previously set value of `ActionContoller::Base.perform_caching`, setting it for the local suite, and resetting it back to the original value after it completes.

This technique may come into play when integrating with certain gems like
[PaperTrail](https://github.com/airblade/paper_trail) which may generate expensive logic or queries not need in most
situations. PaperTrail even [provides a helper](https://github.com/airblade/paper_trail/blob/eef918bca42bab85c4467541037897f0788b6062/lib/paper_trail/frameworks/rspec.rb) to take advantage of RSpec. It may be worth considering whether to provide an interface to toggle behavior and RSpec helpers next time we write a gem.
metadata to toggle behavior in specs.

### Filtering Specs

One useful technique while developing is to run a selected set of specs. We may
be editing acceptances specs, model validations, and other disparate tests while test driving a
feature from [outside to in](http://everydayrails.com/2014/01/15/outside-in-example-ruby-tapas.html).

#### Manual tagging

Adding arbitrary metadata like `:focus` to set of specs is one way to approach
this.

```
# spec/models/user_spec.rb
it "validates a user", :focus do
  # unit test
end

# spec/features/sign_up_spec.rb
it "displays error message", :focus do
  # acceptance spec
end
```

We can now filter our test run to a subset at the command line:

```bash
$ rspec --tag @focus
```

We can also add some global configuration so this will be the default behavior
when using `:focus` specs, as long as we don't make the mistake of filtering on the build server unintentionally.

```rspec
RSpec.configure do |config|
  # enable auto-focus only when running locally
  config.filter_run_including focus: ENV['CI_SERVER_SETTING'].blank?

  config.run_all_when_everything_filtered = true
end
```

Alternatively, avoid running broken or flaky specs when tagged accordingly:

```ruby
it "test that fails intermittently", :flaky do
  # probably a javascript test
end
```

Using either a command line option

```ruby
$ rspec ~flaky
```

or a configuration option, we can filter out specs we wish to ignore.

```ruby
RSpec.configure do |c|
  c.filter_run_excluding flaky: true
end
```

#### Auto Tagging

A less-known feature of RSpec 3 is an API for telling RSpec to derive additional metadata
automatically based on *other* metadata.

For example, each spec example has metadata that includes its file path. This,
along with the `RSpec::Core::Configuration#define_derived_metadata` method,
allows us to alter spec behavior based on the spec directories, for example.

*Why is this useful and how do we use it?* Glad you asked.

Let's say we want to isolate model specs that require database truncation since
they are more like functional specs than unit specs. We may set up our spec
directory like so:

```
spec/
  truncation/
    example1_spec.rb
    example2_spec.rb
    ...
  transaction/
    example1_spec.rb
    example2_spec.rb
    ...
```

Instead of manually tagging each file with our `:truncation_mode` metadata we
used earlier to toggle DatabaseCleaner's truncation strategy, we can configure
all the specs in `spec/truncation` as follows:

```rspec
# spec/spec_helper.rb
RSpec.configure do |config|
  config.define_derived_metadata(file_path: %r{spec/truncation}) do |metadata|
    metadata[:truncation_mode] = true
  end

  # rest of DatabaseCleaner config below
end
```

Now, all specs in the directory will run with the `:truncation_mode` metadata
and the database strategy will be set to `:truncation` as long as it is declared ahead of the additional DatabaseCleaner configuration we referenced earlier.

Note, this is the [same method](https://github.com/rspec/rspec-rails/blob/a09a6231ceecefa177ec08b27c3066d5947e5899/lib/rspec/rails/configuration.rb#L85) used in `rspec-rails` to add custom behavior to specs in the specific directories, e.g. `spec/controllers', `spec/requests, etc.

### Using and Abusing

While using RSpec metadata can be a powerful technique for altering test
behavior and application settings in specs, it can also be taken too far.

As @avdgaag notes in [his blog post on the topic](http://arjanvandergaag.nl/blog/using-abusing-rspec-metadata.html), make sure to distinguish between *how* spec is run from *what* the spec should test. We should probably not use metadata to create records specific to certain testests, or authenticate users for a given context.

One rule of thumb for adding metadata is decide whether it would be generally useful to any Rails app (good) or it is specific to the business logic of your current application (bad). The latter is best set up more explicitly within or alongside your tests.

Before considering a new metadata tag, I ask the rubber duck "Could I extract
this configuration into a gem?" To answer yes, the behavior would have to be
non-specific to my application. If so, the behavior *might* be useful as metadata.

While metadata can nicely separate the boilerplate required to setup and teardown test behavior, it also adds a layer of indirection that can cause readability issues when stretched too far. Understand that there is a big increase in mental overhead to permuting test behavior with each new tag option and consider the tradeoffs with the rest of the team.

Use wisely!
