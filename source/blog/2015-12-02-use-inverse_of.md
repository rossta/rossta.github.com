---
title: Use inverse_of
summary: Skip the Rails magic and set the :inverse_of option on your ActiveRecord associations
author: Ross Kaffenberger
description: ActiveRecord will try hard to infer the inverse relation for your associations, but you may benefit from setting the inverse_of option wherever possible
pull_image: 'https://rossta.net/assets/images/blog/stock/fall-leaves-pexels-photo.jpg'
published: true
# series: ActiveRecord
tags:
  - Rails
  - Code
  - Ruby
---

Let's talk about `:inverse_of`.

We know Rails has ActiveRecord and ActiveRecord gives us associations and associations can really simplify our interactions with databases. These associations provide a number of configuration options, one of which is to set the "inverse of" your current relation.

This option name can be a little confusing at first so let's use an example. Let's say we have an
`Author` class and it `has_many :posts`. This means we should have a `Post` class that maintains a
column, `:author_id`, so it we can say it `belongs_to :author`.

```ruby
# app/models/author.rb
class Author < ActiveRecord::Base
  has_many :posts
end

# app/models/post.rb
class Post < ActiveRecord::Base
  belongs_to :author
end
```

Ok, so we know this means if we have an author, we can ask for her posts.

```ruby
# Loading development environment (Rails 4.2.5)
author = Author.find(1)
#  Author Load (0.3ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
#=> #<Author:0x007fde81898868 id: 1, ... >

author.posts
#  Post Load (0.4ms)  SELECT "posts".* FROM "posts" WHERE "posts"."author_id" = $1  [["author_id", 1]]
#=> [#<Post:0x007fde810cb4a0 id: 1, ... >, #<Post:0x007fde810cb248 id: 2, ... >, ... ]
```

We can also query for a post and ask for its author.

```ruby
post = Post.find(1)
#  Post Load (0.3ms)  SELECT  "posts".* FROM "posts" WHERE "posts"."id" = $1 LIMIT 1  [["id", 1]]
#=> #<Post:0x007fde81c7d730 id: 1, ... >

post.author
#  Author Load (0.3ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
#=> #<Author:0x007fde7a5c8518 id: 1, ... >
```

### What It's For

Now, for most of our associations, Rails helps us find the **inverse** relation. For example, if we
start with an author, then ask for her posts, each post will "know" that the inverse instance of this
relationship is the author. If we iterate over each of `author.posts` and ask each post for its
author, we expect to get the same author record:

```ruby
author.posts.map { |post| post.author }
# => [#<Author:0x007fde81898868 id: 1, ... >, #<Author:0x007fde81898868 id: 1, ... >, ...]
```

For consistency, we want each post's author not only to be the same record, but the same
**instance** in memory. If I modify one author's attributes, I expect that change to be reflected no
matter with inverse I'm working with. Let's confirm by inspecting the `:object_id`:

```ruby
author.object_id
# => 70296816370740

object_ids = [author.object_id] + author.posts.map { |post| post.author.object_id }
# => [70296816370740, 70296816370740, 70296816370740, ... ]

object_ids.uniq.size == 1
# => true
```

Great!, This means we can say that, for the `Author` class, `:author` is the "inverse of" the
`has_many :posts` association. So we could add the `:inverse_of` option to specify the name of the
inverse association to ensure our object instances match up.

```ruby
# app/models/author.rb
class Author < ActiveRecord::Base
  has_many :posts, inverse_of: :author
end

# app/models/post.rb
class Post < ActiveRecord::Base
  belongs_to :author, inverse_of: :post
end
```

For this example, providing this option will not change the behavior because Rails is already
setting the correct inverse instances as we might expect.

It may seem obvious, but Rails has to do some work to set the inverse instance on records in an association and must infer the object based on the class name and association name.

So it should **just work™**!

### It Doesn't Always Work

I noticed something odd the other day.

I was reviewing code for our Rails app which introduced abstraction to render a list of items given by a `has_many` association. The code was passing around the inverse instance (the original owner of the association) all over the place.

Wouldn't we expect the inverse to be available on our `has_many` items?

Let's look at an oversimplified example of what we were dealing with. Building on our `Author` and `Post` from earlier, we'll add a `Tweet` class. Using ActiveRecord's single-table inheritance mechanism, `Tweet` inherits functionality from `Post`.

```ruby
# app/models/author.rb
class Author < ActiveRecord::Base
  has_many :posts
  has_many :tweets, class_name: 'Tweet'
end

# app/models/post.rb
class Post < ActiveRecord::Base
  belongs_to :author
end

# app/models/tweet.rb
class Tweet < Post
  validates :text, length: { maximum: 140 }
end
```

The `Author` class `has_many :tweets` and each tweet has an author since it inherits its associations from `Post`.

```ruby
tweet = Tweet.last
#=> #<Tweet:0x007fc24c1dadd8 id: 10, ... >

tweet.author
#=> #<Author:0x007fc248e11998# id: 1, ... >
```

The code was rendering each tweet in a list and each tweet needed to refer back to the author for additional data.

```ruby
author = Author.find(1)
# Author Load (0.2ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
#=> #<Author:0x007fc24dee1ad0 ...>

author.tweets.map { |tw| author.twitter_handle }
# Tweet Load (0.3ms)  SELECT "posts".* FROM "posts" WHERE "posts"."type" IN ('Tweet') AND "posts"."author_id" = $1  [["author_id", 1]]
#=> ['vicenta', 'vicenta', ... ]
```

It seemed odd to pass the author author around.

Each `tweet` defines its `author` association since it inherits from `Post`. I knew my colleague would have had a good reason for passing the `author` instance along so I opened up a `rails console` to find out what happened if I used the inverse association instead:

```ruby
author = Author.find(1)
# Author Load (0.2ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
#=> #<Author:0x007fc24dee1ad0 ...>

author.tweets.map { |tw| tw.author.twitter_handle }
# Tweet Load (0.3ms)  SELECT "posts".* FROM "posts" WHERE "posts"."type" IN ('Tweet') AND "posts"."author_id" = $1  [["author_id", 1]]
# Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
# Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
# Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
# Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
# Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
# Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
# Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
# ...
#=> ['vicenta', 'vicenta', ... ]
```

That's a lot of database queries for one author!

It's the classic problem with `has_many` associations: the "N+1" query. After the initial `author.tweet` query, "N" additional queries are needed to call each `tweet.author` back through the `belongs_to` association. We were avoiding the extra lookups by passing around the original author instance.

This is unfortunate because we, as we have seen, it should be possible to avoid these extra queries so that each tweet's author points to the same author object in memory.

Not only do we want to avoid the extra queries, but if modifications are made in one place, we'd like them to be reflected elsewhere. I want to avoid something like this:

```ruby
tweet_1 = author.tweets.first
tweet_2 = author.tweets.second

tweet_1.author.name # => "Cecily"
tweet_1.author.name # => "Cecily"

tweet_1.author.name = "Martha"

tweet_1.author.name # => "Martha"
tweet_1.author.name # => "Cecily"
```

So passing the `author` instance variable into the block, as an additional argument to method calls, or down to a view template is one workaround. But this can be difficult to maintain, especially if we're dealing with more than one author's posts. Wouldn't it be better not to make those unnecessary queries?

Well, it's possible! `:inverse_of` to the rescue.

```ruby
class Author < ActiveRecord::Base
  has_many :tweets, inverse_of: :author
end

class Tweet < ActiveRecord::Base
  belongs_to :author, inverse_of: :tweets
end
```

Now when iterate over the tweets and reference the author, no additional queries
are needed because each tweet can now assign its author association from the
instance that exists already in memory:

```ruby
author = Author.find(1)
# Author Load (0.3ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
#=> #<Author:0x007fc24c65c028 ... >
author.tweets.map { |tw| tw.author.twitter_handle }
# Tweet Load (0.3ms)  SELECT "posts".* FROM "posts" WHERE "posts"."type" IN ('Tweet') AND "posts"."author_id" = $1  [["author_id", 1]]
=> ["vicenta", ... ]
```

Notice that additional queries for the author (`Author Load...`) don't appear in the query log: no more "N+1"!

You might be asking... why doesn't Rails just do this by default all the time? That's a good question. Turns out, it's not so easy. The [Rails guides]() say:

> Every association will attempt to automatically find the inverse association and set the `:inverse_of` option heuristically (based on the association name). Most associations with standard names will be supported.

So Rails will "try hard" to make the inverse association work automatically to prevent the extra queries. If no name is found with the `:inverse_of` key in the association options, ActiveRecord will try to find the inverse association automatically inferring the class name from the association name, i.e. as `Post` is implied by `has_many :posts`.

But when the name of the association and the name of the class Rails expects to find in the
association don't match, setting the inverse won't work automatically. Then you may see extra
queries for objects that already exist in memory.

### Avoid Uncertainty, Be Explicit

Here's my recommendation:

**Set the `:inverse_of` option wherever you can.**

Yeah, Rails will try hard to do automatic inverses on your behalf, but leaving it up to Rails adds uncertainty. The uncertainty makes me uncomfortable. Here's an opportunity to reduce the chances that a name change or a Rails upgrade will introduce unexpected behavior to your application. I don't really want to write tests to be sure I'm not unintentionally generating a "N+1" queries for my associations. I want to make it easier to introduce other changes into my app later.

Beware of the gotchas: [check out to the Rails docs on bi-directional associations](http://guides.rubyonrails.org/association_basics.html#bi-directional-associations), `:inverse_of` will only work with `has_many`, `has_one`, and `belong_to` and must also not contain `:conditions`, `:through`, `:polymorphic`, and `:foreign_key`.

Save yourself the trouble and set `:inverse_of` for valid `belongs_to`, `:has_many`, and `:has_one` associations.
