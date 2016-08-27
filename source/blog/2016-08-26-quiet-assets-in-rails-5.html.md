---
title: Quiet assets in Rails 5
author: Ross Kaffenberger
published: true
summary: How to silence asset request logging in Rails 5 development
description: Sprockets recently added the ability to serve assets Quiet Assets in Rails 5
pull_image: 'blog/stock/outerspace-unsplash.jpg'
series:
category: Code
tags:
  - Rails
---

Recent changes to the `sprockets-rails` gem now include a configuration option
for silencing the logging of requests for assets in development.

### The problem

I love logs. Whenever someone comes to me with a Rails problem or we need to
debug something, the first question I'm thinking is, "What do the logs say?".

That said, sometimes Rails logs more than we need. By default, Rails will log the web requests for each asset in developemnt. Each page load could incur several to many additional request for JavaScript, CSS, and images, potentially drowning your STDOUT or `development.log` with requests like this:

```bash
Started GET "/assets/jquery.self-bd7ddd393353a8d2480a622e80342adf488fb6006d667e8b42e4c0073393abee.js?body=1" for 127.0.0.1 at 2016-08-27 18:38:00 -0400
...
```

Unless you're debugging an issue in the asset pipeline, numerous asset requests are not very useful and tend to mask the typically more important info logged in the controller actions.

### Quieting assets, the old way

To disable this behavior, many Rails 4 projects have used the `quiet_assets`
gem. How does the `quiet_assets` gem work? It [monkeypatches the
`Rails::Rack::Logger`](https://github.com/evrone/quiet_assets/blob/e54ca548f005ca2a93e781c7b583ff4d0b59dd35/lib/quiet_assets.rb#L20).

Here's the relevant code provided in the gem:

```ruby
Rails::Rack::Logger.class_eval do
  def call_with_quiet_assets(env)
    begin
      if env['PATH_INFO'] =~ ASSETS_REGEX
        env[KEY] = Rails.logger.level
        Rails.logger.level = Logger::ERROR
      end
      call_without_quiet_assets(env)
    ensure
      Rails.logger.level = env[KEY] if env[KEY]
    end
  end
  alias_method_chain :call, :quiet_assets
end
```

`Rails::Rack::Logger` is a middleware that logs all requests coming into your
Rails app and implements an `ActiveSupport::Notification` for each request you
can hook into for additional information. The `quiet_assets` gem simply sets the
log level to `Logger::Error` for any request matching your application's assets
path prefix, which means it won't show up in your log file or `STDOUT`.

### Replacing the quiet_assets gem

Now, as of `sprockets-rails 3.1.1`, this gem is not needed. At the time of this
writing, this is the latest version of `sprockets-rails` that would be installed
in a fresh Rails 5 application.

With `sprockets-rails 3.1.1` installed, you can now set a Rails configuration
option to quiet asset logging:

```ruby
# config/environments/development.rb

Rails.application.configure do

  config.assets.quiet = true

  # ...
end
```

So how does this approach work? The `sprockets-rails` gem now inserts an additional middleware ahead of `Rails::Rack::Logger` in the middleware stack:

```bash
$ bin/rake middleware
# ...
use Sprockets::Rails::QuietAssets
use Rails::Rack::Logger
# ...
```

The `Sprockets::Rails::Middleware` also matches on asset requests, but instead
uses the `Rails.logger.silence { ... }` block method to change the log level to
`Logger::ERROR`. The entire middleware is only 18 lines:

```ruby
module Sprockets
  module Rails
    class QuietAssets
      def initialize(app)
        @app = app
        @assets_regex = %r(\A/{0,2}#{::Rails.application.config.assets.prefix})
      end

      def call(env)
        if env['PATH_INFO'] =~ @assets_regex
          ::Rails.logger.silence { @app.call(env) }  # silences the logs!
        else
          @app.call(env)
        end
      end
    end
  end
end
```

Here's a [link to the recent pull request](https://github.com/rails/sprockets-rails/pull/355) if you're interested to take a closer look. Of course, this feature isn't just for Rails 5; it should also be possible for you to upgrade to this version of `sprockets-rails` for existing Rails 4 applications.

In case you're wondering, the `::Rails.logger.silence { ... }` call assumes your
Rails logger includes the [`LoggerSilence` module](http://api.rubyonrails.org/classes/LoggerSilence.html), which works very much like the relevant code provided by the `quiet_assets` gem.

### Logging to STDOUT

You may be surprised then to see asset requests fail if you're using a non-compliant logger. Unfortunately, this includes the stdlib Ruby `Logger`, which, of course, does not include the `LoggerSilence` module. You might be using Ruby's `Logger` if you've followed common recommendations to change your Rails logger to log to `STDOUT`, as in [this tutorial](http://blog.bigbinary.com/2016/04/12/rails-5-allows-to-send-log-to-stdout-via-environment-variable.html):

```ruby
config.logger = ActiveSupport::TaggedLogging.new(Logger.new(STDOUT))
```

I ran into this issue recently when assets were failing to load after I upgraded
to `sprockets-rails 3.1.1` and began seeing `NoMethodError: undefined method 'silence' for #<Logger:...>` in my development logs.

The fix is simple: to log to `STDOUT` and take advantage of the new
`Sprockets::Rails::QuietAssets` middleware, you could use `ActiveSupport::Logger` instead, which inherits from Ruby `Logger` and includes `LoggerSilence`:

```ruby
config.logger = ActiveSupport::TaggedLogging.new(ActiveSupport::Logger.new(STDOUT))
```

Alternatively, we could create our own subclass of `Logger` with `LoggerSilence`
included. If we just want `STDOUT` logging, we could instead use Heroku's
[`rails_stdout_logging`](https://github.com/heroku/rails_stdout_logging) gem,
which will also try to include the `LoggerSilence` module in our logger, if available.

### Resources

Be sure to check out the following links if you're interested to learn more
about customizing your Rails logger. Happy logging!

* [Using the Ruby Logger](http://hawkins.io/2013/08/using-the-ruby-logger/)
* [Rails 5 allows to send log to STDOUT via environment variable](http://blog.bigbinary.com/2016/04/12/rails-5-allows-to-send-log-to-stdout-via-environment-variable.html)
* [Ruby Logger](https://ruby-doc.org/stdlib-2.3.0/libdoc/logger/rdoc/Logger.html)
* [LoggerSilence](http://apidock.com/rails/LoggerSilence/silence)
* [Debug Rails faster with quiet assets & quieter logs](https://eliotsykes.com/quiet-assets)
* [Quiet Assets gem](https://github.com/evrone/quiet_assets)
* [Rails STDOUT logging gem](https://github.com/heroku/rails_stdout_logging)
* [PR to introduce quiet assets to `sprockets-rails`](https://github.com/rails/sprockets-rails/pull/355)
