---
title: Developing with local Ruby gems
author: Ross Kaffenberger
published: true
summary: Stop adding :path in your Gemfile and use bundle config instead
description: Use the "bundle config" command to develop against local Ruby gems instead of following the typical advice to specify the :path option in your Gemfile.
pull_image: 'blog/stock/jellyfish-pexels-photo.jpeg'
tags:
  - Code
  - Ruby
  - Process
---

Let's say you're building a Ruby app and your team has extracted one or more
gems referenced in your Gemfile, such as your custom Trello API client, [Tacokit.rb](https://github.com/rossta/tacokit.rb).

```ruby
# Gemfile
source "https://rubygems.org"

# lots of gems ...

gem "tacokit"
```

Maybe Trello made some recent changes to their API that your current feature depends
on, so you need to update the `Tacokit` gem as part of your work. You have a
local checkout of the `tacokit` gem in another directory in your laptop.

You add some code to the gem, but now you want to test the changes in your app. How do you do that?

According to [the most popular answer (and accepted) answer](http://stackoverflow.com/questions/4487948/how-can-i-specify-a-local-gem-in-my-gemfile#answer-4488110) to the question, ["How can I specify a local gem in my Gemfile?"](http://stackoverflow.com/questions/4487948/how-can-i-specify-a-local-gem-in-my-gemfile), we should do the following:

```ruby
gem "tacokit", path: "/path/to/tacokit"
```

Run `$ bundle update`, restart the app, and - boom! - it works! Our changes in
the local `tacokit` checkout are showing up as expected.

Then we push our app changes and deploy to the staging server to test them out
in the shared environment and - wait a minute - the app won't even start.

Oops! We forgot to remove the `:path` reference in the `Gemfile`.

Let's fix that... we remove the `:path` reference, push, and redeploy. The app
restarts fine. But while testing the feature, we start getting 500 errors. This wasn't happening locally.

> "But it worked on my machine!" - *every developer ever*

The Rails logs reveal we have a bunch of undefined method errors coming from calls to `Tacokit`. That's right, we forgot another key step in this workflow: pushing our local `Tacokit` changes to the remote!

OK, after we've done that and redeployed the app, we're still getting 500 errors.

D'oh! We were working on a *branch* of `tacokit` but we reference it in our app's `Gemfile`.

Good thing we weren't pushing that app feature to production. We would have been wise to run the tests on our CI server first where we would have seen the same errors (assuming we had the right tests... and a CI server).

### Here's the thing

If you're using `:path` in your `Gemfile`, you're doing it wrong.

The problem with `:path` is it points to a location that only exists on our local machine.

Every time we want to develop against the local `tacokit` gem, we have to remember to edit the `Gemfile` to remove the option so we don't screw up our teammates or break the build. We also have to remember to push those changes to the remote repository before updating our app.

This workflow is no good because we're human and humans tend to forget to do things.

### A better way

Buried deep in the Bundler docs is a better solution for [working with local git repo](http://bundler.io/git.html#local): the `bundle config local` command. Instead of specifying the `:path` option, we can run the following on command line:

```sh
$ bundle config local.tacokit /path/to/tacokit
```

Here we instruct Bundler to look in a local resource by modifying our local Bundler configuration. That's the one that lives in
`.bundle/config` outside of version control.

**This means we won't check in an invalid path.**

We can confirm the link with `bundle config`:

```sh
$ bundle config
Settings are listed in order of priority. The top value will be used.
local.tacokit
Set for your local app (/Users/rossta/.bundle/config): "/Users/rossta/path/to/tacokit"
```

We can scope the configuration to a specific folder with the `--local` flag:

```sh
$ bundle config --local local.tacokit /path/to/tacokit
$ bundle config
Settings are listed in order of priority. The top value will be used.
local.tacokit
Set for your local app (/Users/rossta/path/to/app/.bundle/config): "/Users/rossta/path/to/tacokit"
```

To take advantage of this local override in the app, we have to specify the remote repo and branch in the `Gemfile`:

```ruby
gem "tacokit", github: "rossta/tacokit", branch: "master"
```

Bundler will abort if the local gem branch doesn't match the one in the `Gemfile`.

**Now we won't point to the wrong branch in Gemfile.lock.**

Even better, Bundler will also check to be sure the local changes have been
pushed to the remote repo. Failing fast is a good thing!

**No more forgetting to push our local gem changes.**

It's also easy to remove the local config after we don't need it:

`bundle config --delete local.YOUR_GEM_NAME`

### Don't use :path, use bundle config local instead

Though convenient, using the `:path` option in our `Gemfile` to point to a local
gem sets us up for three potential problems without an automated prevention:

* Committing a nonexistent lookup path on other machines
* Failing to point to the correct repository branch
* Failing to push local changes to the remote

Forget the `:path` option and you'll never forget ^^this stuff^^ again.

Just use this command:

```sh
bundle config local.YOUR_GEM_NAME`
```

And don't believe everything you read on StackOverflow.
