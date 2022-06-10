---
title: N+1 is a Rails feature
author: Ross Kaffenberger
published: true
summary: Solving this issue with eager loading may not always be best
description: In which we talk about how N+1 queries allow Rails developers to opt for Russian Doll caching to address performance bottlenecks.
thumbnail: 'blog/stock/ladybug-pexels-photo.jpg'
series:
category: Code
tags:
  - Rails
---

*To be clear, N+1 queries in your app are bad. That they are a default behavior
  through due to lazy loading in Rails enables developers to take advantage of Russian doll caching to tune performance - a necessary step to scale Ruby apps.*

One of the many mantras one learns on the path to "Rails enlightenment" is:

BEWARE OF THE N+1 QUERY!

You might be surprised to hear the conventional advice around fixing the N+1
problem may not always be the best option.

### Everyone's favorite issue

To refresh, an N+1 query occurs when an association for a requested resource leads to N additional separate queries. Here's what an N+1 query looks like in the Rails log where a `post` request is followed by N requests for their associated `authors`:

```sh
Started GET "/posts" for ::1 at 2016-09-18 07:26:15 -0400
Processing by PostsController#index as HTML
  Rendering posts/index.html.erb within layouts/application
  Post Load (2.2ms)  SELECT "posts".* FROM "posts" ORDER BY "posts"."published_at" DESC
  Author Load (0.2ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT $2  [["id", 90], ["LIMIT", 1]]
  Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT $2  [["id", 82], ["LIMIT", 1]]
  Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT $2  [["id", 83], ["LIMIT", 1]]
  #...
```

A quick search for [N+1 Rails](https://www.google.com/search?q=N%2B1+Rails&oq=N%2B1+Rails&aqs=chrome..69i57j69i60l2.2907j0j1&sourceid=chrome&ie=UTF-8) reveals many posts describing "eager loading" as state that the *silver bullet* to this problem.

There is actually a gem called [`bullet`](https://github.com/flyerhzm/bullet) that will help resolve your N+1 issues with warnings and suggestions right in your logs to use eager loading where appropriate.

Typically, this means changing a statement like `Post.all` to
`Post.all.includes(:author)` to ensure the authors records are loaded in a
separate query or through a complex join (depending on the nature of the
association). This a really useful technique to reduce the number of queries you're making in your Rails apps to improve response times. We may have even wondered why Rails doesn't just eager load for us.

### When gurus chat

Now consider this. Back in April, the author of [The Complete Guide to Rails Performance](https://www.railsspeed.com/) (check it out, it's awesome), [Nate Berkopec](http://nateberkopec.com/) spoke with [DHH](https://twitter.com/dhh) about, ahem, Rails performance. [Not 5 minutes in](https://youtu.be/ktZLpjCanvg?t=4m27s), DHH says this:

> N+1 is a feature

WTF? But all those queries!

Here's the rest of what he said about it (emphasis mine):

> N+1 is a feature, which is usually seen as a bug, right?
>
> If you have N+1 query it means you're executing
> one SQL query per element so if you have 50 emails in an inbox, that'd be 50
> SQL calls, right? That sounds like a bug. Well in a Russian doll caching setup, it's
> not a bug, it's a feature. <b>The beauty of those individual calls are that
> they're individually cached</b>, on their own timeline, and that they're super simple.
>
> Because the whole way you get around doing N+1 queries is you do joins; you do more complicated queries that take longer to compute, and tax the database harder. If you can simplify those queries so that they're super simple, but there's just more of them, well, you win if and only if you have a caching strategy to support that.

Now I don't agree with everything DHH says, but it's an interesting take on the issue. When he says N+1 is a feature, I believe what he really means is that "lazy loading", which the ActiveRecord query interface uses by default, along with a proper caching strategy *can* be a big advantage. It's this aspect of Rails that has enabled his team to squeeze out sub-100 ms response times at Basecamp.

ActiveRecord will defer the SQL queries for associations until they are accessed, say, while rendering author details on a list of posts in an index template. N+1 gives you the option to tackle complex pages with many separate
queries that can be wrapped in cache blocks meaning the queries can be skipped
altogether on subsequent requests. On the other hand, using
the broadly-recommended strategy of using `includes` to eager-load data means we
incur that additional, potentially complex, query on each page request, regardless of caching strategies.

### Hrm, example please

Let's illustrate DHH's point with a simple example where we have a Rails app
that renders an index of `Post` models at `/posts`. Each `Post` belongs to an
`Author` whose details are rendered inline on the index page.

```ruby
# app/models/post.rb
class Post < ApplicationRecord
  belongs_to :author
end

# app/models/author.rb
class Author < ApplicationRecord
  has_many :posts
end

# app/controllers/posts_controller.rb
class PostsController < ApplicationController
  def index
    @posts = Post.all.order(published_at: :desc)
  end
end

# posts/index.html.erb
<% @posts.each do |post| %>
  <div>
    <h2><%= link_to post.title, post %><h2>
    <%= render post.author %>
  </div>
<% end %>
```

Rendering this page will reveal the N+1 query in our Rails log, where each
author is queried individually for each post.

```sh
# log/development.log

Started GET "/posts" for ::1 at 2016-09-18 07:26:15 -0400
Processing by PostsController#index as HTML
  Rendering posts/index.html.erb within layouts/application
  Post Load (2.2ms)  SELECT "posts".* FROM "posts" ORDER BY "posts"."published_at" DESC
  Author Load (0.2ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT $2  [["id", 90], ["LIMIT", 1]]
  Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT $2  [["id", 82], ["LIMIT", 1]]
  Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT $2  [["id", 83], ["LIMIT", 1]]
  #...
```

The common suggestion to fix this N+1 query is to use `includes` to eager load
the author records. Now our N+1 query is reduced to two queries: one for all the
posts and one for all the authors.

```
class PostsController < ApplicationController
  def index
    @posts = Post.all.order(published_at: :desc).includes(:author) # eager loads
authors
  end
end
```

```
Started GET "/posts" for ::1 at 2016-09-18 07:29:09 -0400
Processing by PostsController#index as HTML
  Rendering posts/index.html.erb within layouts/application
  Post Load (2.2ms)  SELECT "posts".* FROM "posts" ORDER BY "posts"."published_at" DESC
  Author Load (0.4ms)  SELECT "authors".* FROM "authors" WHERE "authors"."id" IN (90, 82, 83, 89, 81, 84, 85, 86, 87, 88)
  # rendering
```

Let's say we later add fragment caching to the view by wrapping each post in a
cache block:

```erb
<% @posts.each do |post| %>
  <% cache post do %>
    <div>
      <h2><%= link_to post.title, post %><h2>
      <%= render post.author %>
    </div>
  <% end %>
<% end %>
```

We need to enable caching in our development environment to test it out locally. In Rails 5, you can run a simple command to instruct your Rails server to turn on caching:

```sh
$ bin/rails dev:cache
```

In Rails 4, you'll need to edit your development configuration yourself:

```ruby
# config/development.rb
config.action_controller.perform_caching = true
config.cache_store = :memory_store
```

With caching enabled and while eager loading authors in our controller, we can see
the fragment caching at work in the Rails log. Since the cache is cold on the
first page render, you'll see alternating Reads that miss and subsequence Writes
for posts and authors.

```sh
Started GET "/posts" for ::1 at 2016-09-18 08:25:17 -0400
Processing by PostsController#index as HTML
  Rendering posts/index.html.erb within layouts/application
  Post Load (1.3ms)  SELECT  "posts".* FROM "posts" ORDER BY "posts"."published_at" DESC LIMIT $1  [["LIMIT", 20]]
  Author Load (0.3ms)  SELECT "authors".* FROM "authors" WHERE "authors"."id" IN (90, 82, 83, 89, 81, 84, 85, 86, 87, 88)
  Read fragment views/posts/679-20160918112202701660/e554fd834425697f04b28a155f7cfd0d (0.1ms)
  Read fragment views/authors/90-20160918113201462920/5c4a91f59546eb97daa8693b93d7c376 (0.0ms)
  Write fragment views/authors/90-20160918113201462920/5c4a91f59546eb97daa8693b93d7c376 (0.1ms)
  Rendered authors/_author.html.erb (4.0ms)
  Write fragment views/posts/679-20160918112202701660/e554fd834425697f04b28a155f7cfd0d (0.3ms)
  Read fragment views/posts/725-20160918120741840748/e554fd834425697f04b28a155f7cfd0d (0.0ms)
  # ...
```

With the cache now warm, still using `includes` in the controller, we see the
two queries and reads for each post:

```sh
Started GET "/posts" for ::1 at 2016-09-18 08:27:36 -0400
Processing by PostsController#index as HTML
  Rendering posts/index.html.erb within layouts/application
  Post Load (1.5ms)  SELECT  "posts".* FROM "posts" ORDER BY "posts"."published_at" DESC LIMIT $1  [["LIMIT", 20]]
  Author Load (0.8ms)  SELECT "authors".* FROM "authors" WHERE "authors"."id" IN (90, 82, 83, 89, 81, 84, 85, 86, 87, 88)
  Read fragment views/posts/679-20160918112202701660/e554fd834425697f04b28a155f7cfd0d (0.1ms)
  Read fragment views/posts/725-20160918120741840748/e554fd834425697f04b28a155f7cfd0d (0.0ms)
```

Notice that the authors are still queried because we're still eager loading even
though this data won't be used in a warm cache. What a waste! In truth, it doesn't matter much for this simplistic example, but we can imagine an eager-loaded complex query creating a problem for us in a real world use case.

We can eliminate the wasted authors query by removing the `includes` method call from our controller. Now our fully-cached page request requires only one query for the posts:

```sh
Started GET "/posts" for ::1 at 2016-09-18 07:41:09 -0400
Processing by PostsController#index as HTML
  Rendering posts/index.html.erb within layouts/application
  Post Load (2.3ms)  SELECT "posts".* FROM "posts" ORDER BY "posts"."published_at" DESC
  Read fragment views/posts/679-20160918112202701660/8c2dcb06ead7afb44586a0d022005ef0 (0.0ms)
  Read fragment views/posts/725-20160918112202826113/8c2dcb06ead7afb44586a0d022005ef0 (0.0ms)
```

In either case, we want to be sure the post cache is expired if the author
details change. To set this up, we'll need to link the updates of an author to
her posts. A basic change could be to `touch` each post when an author is
updated.

```ruby
class Author < ApplicationRecord
  has_many :posts

  after_touch :touch_posts

  def touch_posts
    posts.find_each(&:touch)
  end
end
```

Now that we're no longer eager loading authors, only the posts and authors
who've been updated need to be rewritten to cache. In our `development.log`,
we'll see only see the additional queries for associations when an author is updated, triggering cache invalidation on the author and associated posts:

```sh
Started GET "/posts" for ::1 at 2016-09-18 08:07:53 -0400
Processing by PostsController#index as HTML
  Rendering posts/index.html.erb within layouts/application
  Post Load (16.1ms)  SELECT  "posts".* FROM "posts" ORDER BY "posts"."published_at" DESC LIMIT $1  [["LIMIT", 20]]
  Read fragment views/posts/679-20160918112202701660/e554fd834425697f04b28a155f7cfd0d (0.1ms)
  Read fragment views/posts/725-20160918120741840748/e554fd834425697f04b28a155f7cfd0d (0.0ms)
  Author Load (0.2ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT $2  [["id", 82], ["LIMIT", 1]]
  Read fragment views/authors/82-20160918120741822003/5c4a91f59546eb97daa8693b93d7c376 (0.0ms)
  Write fragment views/authors/82-20160918120741822003/5c4a91f59546eb97daa8693b93d7c376 (0.0ms)
  Rendered authors/_author.html.erb (2.4ms)
  Write fragment views/posts/725-20160918120741840748/e554fd834425697f04b28a155f7cfd0d (0.0ms)
  Read fragment views/posts/541-20160918112202120403/e554fd834425697f04b28a155f7cfd0d (0.0ms)
  Read fragment views/posts/634-20160918112202551250/e554fd834425697f04b28a155f7cfd0d (0.0ms)
```

Assuming authors and posts aren't updated frequently, leaving the N+1 query in
place along with a proper Russian Doll caching scheme might better for overall app performance than triggering complex eager loading queries on every request.

### Go forth and measure

Eager loading may not always be the best the cure for our N+1 ailments.

The point of this article isn't to 💩 on eager loading - it's an important
tool to have in your toolbox - but to encourage Rails developers to understand
how lazy loading and N+1 queries allow for Russian Doll caching to be a useful alternative to addressing performance bottlenecks in your Rails applications.

Keep in mind, Russian doll caching may not be the best approach for your app, especially if that cache is frequently cleared or updated. Caching also means you'll need to think about cache expiry which introduces its own set of challenges. As with any discussion of performance, profiling and benchmarking is a required step to before deciding how to tune your app for performance, so it's up to you to determine the best approach.

Just beware of silver bullets.
