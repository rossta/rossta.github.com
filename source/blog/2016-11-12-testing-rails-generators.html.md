---
title: Testing Rails generators
author: Ross Kaffenberger
published: true
summary: Using Rails::Generators::TestCase to test drive your own generators
description: This tutorial shows how to use Rails::Generators::TestCase to test drive your own Rails generators
pull_image: 'blog/stock/brooklyn-bridge-suspension-pexels-photo.jpg'
series:
category: Code
tags:
  - Rails
---

This is the post I wished existed before attempting to write tests for a Rails generator with TDD.

I recently added a Rails generator to my gem, `serviceworker-rails`, to make it easier to add the assets and configuration files needed to [turn your Rails app into a Progressive Web App](/blog/make-your-rails-app-a-progressive-web-app.html). I've written a few Rails generators before, but have usually skipped the part about writing tests because––no excuse.

## The requirements

Rails generators are commonly used to create and/more modify project files in a Rails project. Setting up a Rails project with a Service Worker in the Rails asset pipeline can be a bit involved, and using the Rails generator to take care of the boilerplate makes it more convenient to get up-and-running with the gem.

Here's what the `serviceworker-rails` install generator does:

* Adds a starter `serviceworker.js` file and companion JavaScript to `app/assets/javascripts` for service worker registration
* Modifies 'application.js` to require the companion JavaScript
* Adds a web app manifest file, `manifest.json`, to `app/assets/javascripts`
* Adds a `<link>` tag to the application layout for the browser to locate the manifest
* Adds a Rails initializer to configure the serviceworker asset routes
* Modifies `config/initializers/assets.rb` to precompile `serviceworker.js`
* Adds a default `offline.html` file to `public/`

Though this is a testing post but I'll briefly mention some resources I've found helpeful for writing Rails generators. I recommend the [Rails guides](http://guides.rubyonrails.org/generators.html) to get your Rails generator started. It also help to understand how `Thor` works ([What is Thor?](http://whatisthor.com/)), the library on which most Rails commandline tools are based. The Rails generator base classes leverage [Thor actions](http://www.rubydoc.info/github/erikhuda/thor/master/Thor/Actions), i.e., `create_file`, `gsub_file`, `insert_into_file`, and sprinkle in some [Rails-specific methods](http://api.rubyonrails.org/classes/Rails/Generators/Actions.html), including `gem`, `rake`, `initializer`, etc.

## A first pass

So: how do I test this?

Without consulting an external library for "testing Rails generators", I wanted to take a pass at figuring it out on my own. I'd need to run the generator in the tests to verify the output and that the generator is working. This means the tests would have side effects that modify the file system.

When using database access in tests, we typically expect to wipe test database clean before each test either by truncating or rolling back transactions. Modifying the file system is pretty much the same thing we're trying to do with testing a Rails generator: trigger some side effects, wipe the slate clean, repeat.

Since the `serviceworker-rails` generator adds and modifies files in a Rails app, I decided I needed to generate a fresh Rails app while running the tests and delete it after the tests finish. Crazy, right? I ended up with a test helper that generates the app with something like this:

```ruby
def generate_sample_app
  system "rails new dummy --skip-active-record --skip-test-unit --skip-spring --skip-bundle"
end
```

Skipping all those features simplified things a bit, but still, creating and destroying a temporary Rails app for each test was overkill so I decided to generate the Rails app once, before all the tests were run. Since I use `MiniTest` for `serviceworker-rails`, the test setup looked like this:

```ruby
class ServiceWorker::InstallGeneratorTest < MiniTest::Test
  include GeneratorTestHelpers

  generate_sample_app

  Minitest.after_run do
    remove_sample_app
  end
end
```

For the tests, I also started by running the rails generator command to invoke
my install generator. So given this library code:

```ruby

require "rails/generators"

module Serviceworker
  module Generators
    class InstallGenerator < ::Rails::Generators::Base

      def create_assets
        template "manifest.json", javascripts_dir("manifest.json.erb")
        template "serviceworker.js", javascripts_dir("serviceworker.js.erb")
        template "serviceworker-companion.js", javascripts_dir("serviceworker-companion.js")
      end

      # ... additional steps
    end
  end
end
```

I could run the generator for each test with:

```ruby
def run_serviceworker_generator
  system "rails generator serviceworker:install"
end
```

I also needed to make the following types of assertions:

* assert that a file was generated at a given location
* assert the contents of a generated or modified file
* assert a generated file with interpolations renders valid output

For this first pass, I ended up with something very similar to Zurb's
`foundation-rails` tests for its install generator: [spec](https://github.com/zurb/foundation-rails/blob/4dfe9b12e8cf3a1aa04b257ff64c782832efc6a0/spec/features/generator_spec.rb) and [helper
methods](https://github.com/zurb/foundation-rails/blob/4dfe9b12e8cf3a1aa04b257ff64c782832efc6a0/spec/support/helpers.rb).

```ruby
def test_generates_serviceworker
   serviceworker_js = File.read(sample_app_path("app/assets/javascripts/serviceworker.js.erb"))
   companion_js = File.read(sample_app_path("app/assets/javascripts/serviceworker-companion.js"))

   assert serviceworker_js =~ /self.addEventListener\('install', onInstall\)/,
     "Expected serviceworker to be generated"
   assert companion_js =~ /navigator.serviceWorker.register/,
     "Expected serviceworker companion to be generated"
end
```

I had several tests that read the contents of files and matches expected content
through regular expressions.

## Using Rails::Generators::TestCase

Though what I came up with worked and didn't rely on any third-party dependencies, I wasn't totally happy with it. The tests were very verbose. I didn't like that I had to shell out to run the generator. I finally decided to "peek" and see how Rails tests its own generators, you know, the ones you love for generating models, migrations, and entire resource scaffolds.

It turns out Rails generators are tested using `Rails::Generators::TestCase`. Since Rails tests are also written in `MiniTest` and my library already relies on Rails as a dependency--it *is* a Rails engine--making the switch in my tests easy. If you're using RSpec, I did come across [`ammeter`](https://github.com/alexrothenberg/ammeter), which delegates to `Rails::Generators::TestCase` under the hood, so it'd be quite similar to what I did here.

First, we inherit from the base class:

```ruby
class ServiceWorker::InstallGeneratorTest < ::Rails::Generators::TestCase

end
```

Doing so brings in a bunch of helper methods for configuring the destination
directory, running the generator, and conveniences for making assertions on the generated
files. We declare the generator under test and a destination:

```ruby
class ServiceWorker::InstallGeneratorTest < ::Rails::Generators::TestCase
  tests ServiceWorker::Generators::InstallGenerator
  destination File.expand_path("../tmp", File.dirname(__FILE__))
end
```

Following the style of Rails generator tests, a test case would look like the
following:

```ruby
test "creates a file" do
  run_generator

  # make some assertions about file and its contents
end
```

The `run_generator` method will instatiate the generator class and execute it in
the configured destination directory within the test process (no shell command, yay!). The test case class does provide a setup macro to ensure the destination directory exists:

```ruby
class ServiceWorker::InstallGeneratorTest < ::Rails::Generators::TestCase
  tests ServiceWorker::Generators::InstallGenerator
  destination File.expand_path("../tmp", File.dirname(__FILE__))

  setup :prepare_destination
end
```

However, this method makes no assumptions about what I want to modify in that
directory, so as far as I could tell, I still needed to generate the rails app
in the destination directory and clean it up after the test run. I ended up
keeping the approach I had used previously:

```ruby
class ServiceWorker::InstallGeneratorTest < ::Rails::Generators::TestCase
  include GeneratorTestHelpers

  tests ServiceWorker::Generators::InstallGenerator
  destination File.expand_path("../tmp", File.dirname(__FILE__))

  generate_sample_app

  Minitest.after_run do
    remove_sample_app
  end
end
```

`Rails::Generators::TestCase` provides some useful helper methods.

`assert_file` is used to verify a file was created. The given path would be
relative to the destination directory, Rails root:

```ruby
test "generates serviceworker" do
  run_generator
  assert_file "app/assets/javascripts/serviceworker.js.erb"
end
```

`assert_file` accepts a block that yield the content of the file so we can check
its contents with plain-old `MiniTest` helpers like `assert_match`.

```ruby
test "generates serviceworker" do
  run_generator
  assert_file "app/assets/javascripts/serviceworker.js.erb" do |content|
    assert_match(/self.addEventListener\('install', onInstall\)/, content)
  end
end
```

The complementary `assert_no_file` method is useful for ensuring a file was not created under certain
conditions. There is also `asset_migration` and `assert_no_migration` for
verifying migration files without having to know the migration timestamp to
locate the file by absolute path.

One final technique I used was to verify the output of a generated file after
rendering it with ERB with interpolation. For example, the web app manifest I
provide in the `serviceworker-rails` install generator, `manifest.json.erb`, uses ERB to embed some
Ruby method calls. At compile time for the browser, the file must contain valid
JSON. How to test this again? No convenience methods here, so I rolled up my sleeves on this one.

Here's what the source template looks like for `manifest.json.erb`:

```ruby
<%% icon_sizes = Rails.configuration.serviceworker.icon_sizes %>
{
  "name": "My Progressive Rails App",
  "short_name": "Progressive",
  "start_url": "/",
  "icons": [
  <%% icon_sizes.map { |s| "#{s}x#{s}" }.each.with_index do |dim, i| %>
    {
      "src": "<%%= image_path "serviceworker-rails/heart-#{dim}.png" %>",
      "sizes": "<%%= dim %>",
      "type": "image/png"
    }<%%= i == (icon_sizes.length - 1) ? '' : ',' %>
  <%% end %>
  ],
  "theme_color": "#000000",
  "background_color": "#FFFFFF",
  "display": "fullscreen",
  "orientation": "portrait"
}
```

First, I'm using the "double-percent" style ERB tags, `<%% %>`, on purpose.
Because the template itself is rendered through ERB, the double-percent tag
escapes interpolation so we can actually output ERB tags in its place.

So, for my first attempt, I though I could grab the contents of the manifest ERB template, render it through ERB, parse it as JSON, and make assertions on the JSON object (as a Ruby hash). Something like the following

```ruby
test "generates web app manifest" do
  assert_file "app/assets/javascripts/manifest.json.erb" do |content|
    result = ERB.new(content).result
    json = JSON.parse(result)

    assert_equal json["name"], "My Progressive Rails App"
  end
end
```

Boom, this generated an error:

```ruby
ServiceWorker::InstallGeneratorTest#test_generates_web_app_manifest:
NoMethodError: undefined method `image_path' for main:Object
/Users/ross/.rubies/ruby-2.2.3/lib/ruby/2.2.0/erb.rb:863:in `eval'
/Users/ross/.rubies/ruby-2.2.3/lib/ruby/2.2.0/erb.rb:863:in `result'
/Users/ross/dev/rossta/serviceworker-rails/test/serviceworker/install_generator_test.rb:28:in `block (2 levels) in <class:InstallGeneratorTest>'
/Users/ross/.gem/ruby/2.2.3/gems/railties-4.2.6/lib/rails/generators/testing/assertions.rb:30:in `assert_file'
/Users/ross/dev/rossta/serviceworker-rails/test/serviceworker/install_generator_test.rb:27:in `block in <class:InstallGeneratorTest>'
```

The asset helper method `image_path` is needed to output an appropriate digest urls for the web app icons. This will work in development or asset precompilation for production because this method is provided by the Sprockets environment. While I could load the Sprockets environment just for this test, it seems like both overkill and, honestly, way more work than I'm interested in.

Instead of loading Sprockets, I decided to stub the `image_path` method. The `ERB#result` method takes a `binding` as an optional argument. All Ruby objects have a private method `binding`, which exposes the execution context to other objects, like `ERB` for rendering template strings. The template doesn't care what binding we give it, as long as it responds to the methods and instance variables present in the embedded ERB tags. It's a classic example of dependency injection in the Ruby standard library.

So I defined some helper methods to build up a context to mimic the behavior of
Sprockets by defining an implementation of the `image_path` method and exposing
its `binding` to be passes to the `ERB#result`.

```ruby
def evaluate_erb_asset_template(template)
  engine = ::ERB.new(template)
  asset_binding = asset_context_class.new.context_binding
  engine.result(asset_binding)
end

def asset_context_class
  Class.new do
    def image_path(name)
      "/assets/#{name}"
    end

    def context_binding
      binding
    end
  end
end
```

Now I'm able to assert the contents of the generated, compiled JSON!

```ruby
test "generates web app manifest" do
  assert_file "app/assets/javascripts/manifest.json.erb" do |content|
    json = JSON.parse(evaluate_erb_asset_template(content))

    assert_equal json["name"], "My Progressive Rails App"
  end
end
```

[Check out the source](https://github.com/rossta/serviceworker-rails/blob/94c45720f793397f0df66dbd4d67c680f3a293c3/test/serviceworker/install_generator_test.rb) of the `serviceworker-rails` generator test case to see the full picture of how all the pieces fit together.

## Wrapping up

I don't often have to write generators for my libraries or production codebases,
but now that I've worked through both "rolling my own" testing strategy and
leveraging the behavior of Rails own `Rails::Generators::TestCase`, I think I've
got a good feel for how I can test more generators moving forward.

Hopefully, you'll find this useful when and if you decide to write a Rails generator yourself.
