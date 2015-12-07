---
title: Use "inverse_of"
summary: Improve most of your belongs_to/has_many/has_one ActiveRecord associations with this one weird trick
author: Ross Kaffenberger
published: false
---

I noticed something odd while reviewing code from a colleague for our Rails app the other day. He was introducing a presenter class
that would be responsible for rendering list of items given by a `has_many` association from another object.

Here's a contrived version of the code.

We've got a few ActiveRecord models in our Rails app. An author `has_many` posts
and tweets. `Tweet` uses single-table inheritance (STI) to inherit from `Post`
and add additional functionality.

```ruby
# app/models/author.rb
class Author < ActiveRecord::Base
has_many :posts, dependent: :destroy
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

We were extracting a family of presenters to take a collection of tweets and the author, to render information about each post,
   the author, and some metadata.

   The `TweetsController` instantiates a `TweetsPresenter` to wrap the collection
   of tweets along with the author.

   ```ruby
# app/controllers/tweets_controller.rb
   class TweetsController
  def index
  author = Author.find(params[:author_id])
@posts = TweetsPresenter.new(@posts, author)
  end
  end
  ```

  The view iterates over the tweets yielded by `@posts.each`.

  ```erb
# app/views/posts/_index.html.erb
  <section class="posts">
  <% @posts.each do |post| %>
  <p><%= post.text %></p>
  <p><%= post.author_name %></p>
  <p><%= post.author_handle %></p>
  <% end %>
  </section>
  ```

  This is possible because the presenter defines `#each` to yield each tweet
  wrapped in a `TweetPresenter` responsible for decorating each `tweet`.

  ```ruby
# app/presenters/tweets_presenter.rb
  class TweetsPresenter
def initialize(tweets, author)
  @tweets = tweets
  @author = author
  end

def each(&block)
  @tweets.each do |tweet|
yield TweetPresenter.new(tweet, @author)
  end
  end
  end
  ```
  The `TweetPresenter` takes each tweet and the author and defines some additional methods including those shown below.

  ```ruby

# app/presenters/tweet_presenter.rb
  class TweetPresenter
def initialize(tweet, author)
  @tweet = tweet
  @author = author
  end

  def text
  @tweet.text
  end

  def author_handle
  @author.twitter_handle
  end

  def author_name
  @author.name
  end
  end
  ```

  After absorbing all this, it seemed odd to pass the author all the way down from the controller. Each `tweet` defines its `author` association since it inherits from `Post`:

  ```ruby
  tweet = Tweet.last
# => #<Tweet:0x007fc24c1dadd8 ...>
  tweet.author
# => #<Author:0x007fc248e11998# ...>
  ```

  I had a hunch as I had knew my colleague would have had a good reason for doing
  passing the `author` instance along so I opened up a rails console:

  ```
pry(main)> author = Author.find(1)
Author Load (0.2ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
=> #<Author:0x007fc24dee1ad0 ...>

pry(main)> author.tweets.map { |t| t.author.twitter_handle }
Tweet Load (0.3ms)  SELECT "posts".* FROM "posts" WHERE "posts"."type" IN ('Tweet') AND "posts"."author_id" = $1  [["author_id", 1]]
Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
Author Load (0.1ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
=> ["vicenta", ... ]
```

That's a lot of database queries! It's the classic problem we have when dealing with `has_many` associations: the "N+1" query. After the initial `author.tweet` query, "N" additional queries are needed to call each `tweet.author` back through the `belongs_to` association.

This is unfortunate because we already have a reference to the `author`. The
extra queries mean the author for each individual tweet does not point to the
same author object in memory, even though it represents the same record.

So passing the `author` instance variable into the block (like we've done with the presenter) is one workaround. But this can be difficult to maintain, especially if we're dealing with more than one author's posts. Wouldn't it be better not to make those unnecessary queries?

Well, it's possible! We can let Rails know how to resolve the "inverse" relation
whether we're working with a tweet or author.

We can do this by adding the `inverse_of` option to both the `belongs_to` and the `has_many` association:

```ruby
class Author < ActiveRecord::Base
  has_many :posts, dependent: :destroy, inverse_of: true
end

class Post < ActiveRecord::Base
  belongs_to :author, dependent: :destroy, inverse_of: true
end
```

```ruby
pry(main)> author = Author.find(1)
Author Load (0.3ms)  SELECT  "authors".* FROM "authors" WHERE "authors"."id" = $1 LIMIT 1  [["id", 1]]
=> #<Author:0x007fc24c65c028 ... >
pry(main)> author.tweets.map { |t| t.author.twitter_handle }
Tweet Load (0.3ms)  SELECT "posts".* FROM "posts" WHERE "posts"."type" IN ('Tweet') AND "posts"."author_id" = $1  [["author_id", 1]]
=> ["vicenta", ... ]
```

No more `N+1`!

You might be asking... why doesn't Rails just do this by default? That's a good question. Turns out, it's not so easy. The [Rails guides]() say:

> Every association will attempt to automatically find the inverse association and set the `:inverse_of` option heuristically (based on the association name). Most associations with standard names will be supported.

So, most of the time it will work automatically, but sometimes it won't. The uncertainty is not something to be relied on. To avoid this uncertainy, **always** set `:inverse_of` for any standard `:has_many` or `:has_one` association.

                        >>
# http://api.rubyonrails.org/classes/ActiveRecord/Associations/ClassMethods.html#module-ActiveRecord::Associations::ClassMethods-label-Setting+Inverses

                        == Setting Inverses
#
# If you are using a #belongs_to on the join model, it is a good idea to set the
# <tt>:inverse_of</tt> option on the #belongs_to, which will mean that the following example
# works correctly (where <tt>tags</tt> is a #has_many <tt>:through</tt> association):
#
#   @post = Post.first
#   @tag = @post.tags.build name: "ruby"
#   @tag.save
#
# The last line ought to save the through record (a <tt>Tagging</tt>). This will only work if the
# <tt>:inverse_of</tt> is set:
#
#   class Tagging < ActiveRecord::Base
#     belongs_to :post
#     belongs_to :tag, inverse_of: :taggings
#   end
#
# If you do not set the <tt>:inverse_of</tt> record, the association will
# do its best to match itself up with the correct inverse. Automatic
# inverse detection only works on #has_many, #has_one, and
# #belongs_to associations.
#
                        >>

#
# == Bi-directional associations
#
# When you specify an association there is usually an association on the associated model
# that specifies the same relationship in reverse. For example, with the following models:
#
#    class Dungeon < ActiveRecord::Base
#      has_many :traps
#      has_one :evil_wizard
#    end
#
#    class Trap < ActiveRecord::Base
#      belongs_to :dungeon
#    end
#
#    class EvilWizard < ActiveRecord::Base
#      belongs_to :dungeon
#    end
#
# The +traps+ association on +Dungeon+ and the +dungeon+ association on +Trap+ are
# the inverse of each other and the inverse of the +dungeon+ association on +EvilWizard+
# is the +evil_wizard+ association on +Dungeon+ (and vice-versa). By default,
# Active Record can guess the inverse of the association based on the name
# of the class. The result is the following:
#
#    d = Dungeon.first
#    t = d.traps.first
#    d.object_id == t.dungeon.object_id # => true
#
# The +Dungeon+ instances +d+ and <tt>t.dungeon</tt> in the above example refer to
# the same in-memory instance since the association matches the name of the class.
# The result would be the same if we added +:inverse_of+ to our model definitions:
#
#    class Dungeon < ActiveRecord::Base
#      has_many :traps, inverse_of: :dungeon
#      has_one :evil_wizard, inverse_of: :dungeon
#    end
#
#    class Trap < ActiveRecord::Base
#      belongs_to :dungeon, inverse_of: :traps
#    end
#
#    class EvilWizard < ActiveRecord::Base
#      belongs_to :dungeon, inverse_of: :evil_wizard
#    end
#
# There are limitations to <tt>:inverse_of</tt> support:
#
# * does not work with <tt>:through</tt> associations.
# * does not work with <tt>:polymorphic</tt> associations.
# * for #belongs_to associations #has_many inverse associations are ignored.

# has_many docs
# [:inverse_of]
#   Specifies the name of the #belongs_to association on the associated object
#   that is the inverse of this #has_many association. Does not work in combination
#   with <tt>:through</tt> or <tt>:as</tt> options.
# has_one docs
# [:inverse_of]
#   Specifies the name of the #belongs_to association on the associated object
#   that is the inverse of this #has_one association. Does not work in combination
#   with <tt>:through</tt> or <tt>:as</tt> options.
# belongs_to docs
# [:inverse_of]
#   Specifies the name of the #has_one or #has_many association on the associated
#   object that is the inverse of this #belongs_to association. Does not work in
#   combination with the <tt>:polymorphic</tt> options.

# Inverse of heuristics
# Attempts to find the inverse association name automatically.
# If it cannot find a suitable inverse association name, it returns
# nil.
                        def inverse_name
                        options.fetch(:inverse_of) do
                        if @automatic_inverse_of == false
                        nil
                        else
                        @automatic_inverse_of ||= automatic_inverse_of
                        end
                        end
                        end

# returns either nil or the inverse association name that it finds.
  def automatic_inverse_of
if can_find_inverse_of_automatically?(self)
  inverse_name = ActiveSupport::Inflector.underscore(options[:as] || active_record.name.demodulize).to_sym

  begin
reflection = klass._reflect_on_association(inverse_name)
  rescue NameError
# Give up: we couldn't compute the klass type so we won't be able
# to find any associations either.
  reflection = false
  end

if valid_inverse_reflection?(reflection)
  return inverse_name
  end
  end

  false
  end

# Checks if the inverse reflection that is returned from the
# +automatic_inverse_of+ method is a valid reflection. We must
# make sure that the reflection's active_record name matches up
# with the current reflection's klass name.
#
# Note: klass will always be valid because when there's a NameError
# from calling +klass+, +reflection+ will already be set to false.
def valid_inverse_reflection?(reflection)
  reflection &&
  klass.name == reflection.active_record.name &&
can_find_inverse_of_automatically?(reflection)
  end

# Checks to see if the reflection doesn't have any options that prevent
# us from being able to guess the inverse automatically. First, the
# <tt>inverse_of</tt> option cannot be set to false. Second, we must
# have <tt>has_many</tt>, <tt>has_one</tt>, <tt>belongs_to</tt> associations.
# Third, we must not have options such as <tt>:polymorphic</tt> or
# <tt>:foreign_key</tt> which prevent us from correctly guessing the
# inverse association.
#
# Anything with a scope can additionally ruin our attempt at finding an
# inverse, so we exclude reflections with scopes.
def can_find_inverse_of_automatically?(reflection)
  reflection.options[:inverse_of] != false &&
  VALID_AUTOMATIC_INVERSE_MACROS.include?(reflection.macro) &&
  !INVALID_AUTOMATIC_INVERSE_OPTIONS.any? { |opt| reflection.options[opt] } &&
  !reflection.scope
  end
