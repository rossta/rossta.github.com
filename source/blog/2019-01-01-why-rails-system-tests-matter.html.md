---
title: Why RSpec users should care about Rails system tests
author: Ross Kaffenberger
published: true
summary: Level up your feature tests
description: This post explains why RSpec/Rails users should switch from feature tests to system tests.
pull_image: 'blog/stock/paola-galimberti-mountains-unsplash.jpg'
pull_image_caption: Photo by Paola Galimberti on Unsplash
series:
category: Code
tags:
  - Rails
---

I get the feeling a lot of RSpec users don’t know about the advantages of Rails system tests. RSpec has had "feature" tests for a long time, so same thing right? What’s the big deal?

### Background

For context, RSpec has supported high level testing through [feature tests](https://relishapp.com/rspec/rspec-rails/docs/feature-specs/feature-spec) for many years. Like Cucumber, feature tests are designed to exercise application functionality through the user interface. There are many merits to feature tests as a way to document core business logic and catch regressions. There are drawbacks as well, including the fact that they can be very expensive, i.e., slow, to maintain and execute. I'm going to ignore this for now.

I'll also altogether ignore interesting alternatives for UI and fullstack testing, like [cypress.io](https://www.cypress.io/). This post is aimed at folks working on Rails apps that have accumulated month or years worth of RSpec feature tests.

For a long time, Rails has resisted first class support for this kind of testing, so much of RSpec's integration with Rails is bolted on. It has mostly worked well, though there have been some gotchas which I'll get to.

Last year, that all changed when Rails released system tests in Rails 5.1. On the surface, Rails system tests have pretty much the same usage and goals as RSpec feature tests, including integration with Capybara, the Ruby interface to interacting with numerous webdrivers like headless Chrome, Gecko for Firefox, PhantomJS, etc. So basically everything we've had in RSpec for ages. RSpec developers collectively yawned.

### But wait, there's more

The RSpec team responded by adding first class integration with Rails system tests to RSpec 3.7. So, for the time being, it supports both system tests and feature tests to allow time for developers to switch over. I imagine feature tests will be deprecated in the not-too-distant future.

Why switch? Didn't we just establish system tests and feature tests are basically the same thing? Here's where we get to the key differences.

I've seen a lot of focus in other posts in mechanics of switching, how it's a little easier to setup Capybara configuration, e.g. `driven_by :headless_chrome`. That’s all good, but it's not a big deal.

The real win with system tests is what's happening under the surface. The Rails team made key changes to internals, stuff RSpec alone couldn’t provide.

### Why system tests are better

Awhile back, RSpec feature tests, through Capybara, enabled developers to test UI interactions enabled by JavaScript. With so much logic in our apps going to the frontend, this was a huge improvement over standard Rails testing support, which previously stopped well short of that.

Though this helped increase testing confidence (let’s ignore flaky JS tests for now), this approach also came with a catch: developers had to think about managing the database in their end-to-end JS-enabled acceptance tests.

Backing up a step, RSpec tests are typically individually wrapped in database transactions. This makes rolling back DB changes that occur within each test really fast and easy. But in RSpec acceptance tests against a JavaScript-enabled webdriver like Chrome, wrapping tests in transactions doesn’t work!

The reason is the underlying test implementation is forced to start the Rails server in a separate process from the test itself; any data created in a transaction in the test isn’t committed to the DB, so the Rails server doesn’t have access to the data! Missing data in the JS acceptance tests is really confusing to lots of Rails developers, myself included. To this day, this “gotcha” has tripped me up on new projects.

The workaround, for years, has been to disable transaction mode—the very feature that makes database-backed test faster and easier to rollback for successive tests. To replace this, most RSpec-based Rails projects lean on another gem, DatabaseCleaner, plus some extra configuration, to switch modes just for JS-enabled acceptance tests. The alternative modes are usually either truncate the whole DB or delete all the rows; both slower and sometime problematic when switching back-and-forth. All this instead of just having RSpec rollback transactions without us having to think about it while developing our tests.

Not to mention, having the Rails server run in a separate process makes it a lot harder to debug. If you like using a debugger like pry in your application code, good luck making it work with traditional RSpec acceptance tests.

Rails system tests solves the database problem. [Eileen Uchitelle](https://github.com/eileencodes) on the Rails team made the changes necessary to run ensure test threads and the Rails server can run in the same process by sharing the database connection ([pull request](https://github.com/rails/rails/pull/28083)). This made it possible to wrap system tests in database transactions.

The result: faster rollback, no multiprocess confusion, no need to manage the database with DatabaseCleaner, debugging the server in process is possible, etc. A better solution all around.

### In closing

My public service announcment to RSpec users: Make the switch to system tests. Yes, they are a big deal. For most applications, I suspect [adopting system tests from existing feature tests](https://medium.com/table-xi/a-quick-guide-to-rails-system-tests-in-rspec-b6e9e8a8b5f6) should be straightforward. You’ll still need to fix those flaky tests yourself though.

### Resources

* https://medium.com/table-xi/a-quick-guide-to-rails-system-tests-in-rspec-b6e9e8a8b5f6
* https://everydayrails.com/2018/01/08/rspec-3.7-system-tests.html
* https://chriskottom.com/blog/2017/04/full-stack-testing-with-rails-system-tests/
* https://github.com/rails/rails/pull/28083
* https://stackoverflow.com/questions/44269257/rails-5-1-configuring-built-in-system-tests-with-rspec
