---
title: Configuring Rack Test Driver in Capybara 2
author: rossta
---

First of all, I don't recommended excessive redirects.

Sometimes though, you need more than 5 in your Capybara specs; this is the default redirect limit for [Capybara][1]. When you exceed this limit, you get a dreaded `Capybara::InfiniteRedirectError`.

In Capybara 2.0+, this limit is configurable:

```ruby
Capybara.register_driver :rack_test do |app|
  Capybara::RackTest::Driver.new app, \
    redirect_limit: 15,
    follow_redirects: true,
    respect_data_method: true
end
```

Register a new instance of the rack test driver with options, as shown above. If you're on Rails, it may be necessary for you to set `:respect_data_method` to `true`; this instructs capybara to simulate the request method specified via data-method attributes in your link. With Rails, an extension like [rails/jquery-ujs][2] allows you to enable additional request methods via unobtrusive javascript in real browsers. This setting currently defaults to false in the RackTest driver; one of the primary configurations in [`capybara/rails`][3] is to set this option. So... you may be surprised if you omit this option and suddenly get missing route exceptions in your specs.

The best long term solution for you and your users is to figure out how to reduce or eliminate unnecessary redirects. Playing with the redirect limit in your test environment may be a good way to identify potential problem areas of your app.

[1]: https://github.com/jnicklas/capybara
[2]: https://github.com/rails/jquery-ujs
[3]: https://github.com/jnicklas/capybara/blob/master/lib/capybara/rails.rb
