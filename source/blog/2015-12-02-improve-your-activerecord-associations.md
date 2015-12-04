---
title: Improve your ActiveRecord Associations
summary: Add "inverse_of" to your belongs_to/has_many ActiveRecord associations
author: Ross Kaffenberger
published: false
---

A common problem we have when rendering a `has_many` association is when we need to refer back to the `belongs_to` object in the rendering context.

Something like the following:

```ruby
pry>challenge.updates.map { |up| up.challenge.title }

  Update Load (12.3ms)  SELECT `updates`.* FROM `updates` WHERE `updates`.`challenge_id` = 1593  ORDER BY send_on DESC
  Challenge Load (0.6ms)  SELECT  `challenges`.* FROM `challenges` WHERE `challenges`.`archived_at` IS NULL AND `challenges`.`id` = 1593 LIMIT 1
  Challenge Load (0.6ms)  SELECT  `challenges`.* FROM `challenges` WHERE `challenges`.`archived_at` IS NULL AND `challenges`.`id` = 1593 LIMIT 1
  Challenge Load (0.5ms)  SELECT  `challenges`.* FROM `challenges` WHERE `challenges`.`archived_at` IS NULL AND `challenges`.`id` = 1593 LIMIT 1
  Challenge Load (0.5ms)  SELECT  `challenges`.* FROM `challenges` WHERE `challenges`.`archived_at` IS NULL AND `challenges`.`id` = 1593 LIMIT 1
...
```

That's a lot of database queries! For each update, Rails is generating a new query for its challenge... the same one we already have a refreference to over and over. This is an example of the dreaded "N + 1" query: 1 query for the group of updates and N queries for the challenges for all N updates.

The problem is the associated updates do not have a reference to the challenge we already have in memory. In other words, the challenge "knows" about its updates, but each update doesn't "know" about the original challenge.

One solution is to just pass the `challenge` block:

```ruby
challenge.updates.map { |up| challenge.title }
```

and this may work in a pinch. The problem is, we have to remember to pass in the extra reference whenever it’s needed

There’s a better way!

When this N+1 happens on `has_many` assocation referencing their `belongs_to` instance, it means we’re missing the `inverse_of` option on the association(edited)

The fix, in this case, is:

```ruby
class Challenge
  has_many :updates, inverse_of: :challenge
end

class Update
  belongs_to :challenge, inverse_of: :updates
end
```

that change would lead to

```ruby
pry(main)> cha.updates.map { |up| up.challenge.title }
  Update Load (0.9ms)  SELECT `updates`.* FROM `updates` WHERE `updates`.`challenge_id` = 1593  ORDER BY send_on DESC
=> ["Big Data for Social Good",
 "Big Data for Social Good",
 "Big Data for Social Good",
 "Big Data for Social Good",
 ….
```

No more `N+1`.

You might be asking... why doesn't Rails just do this by default? That's a good question. Turns out, it's not so easy. The [Rails guides]() say:

> Every association will attempt to automatically find the inverse association and set the `:inverse_of` option heuristically (based on the association name). Most associations with standard names will be supported.

So, most of the time it will work automatically, but sometimes it won't. The uncertainty is not something to be relied on. To avoid this uncertainy, **always** set `:inverse_of` for any standard `:has_many` or `:has_one` association.

http://api.rubyonrails.org/classes/ActiveRecord/Associations/ClassMethods.html#module-ActiveRecord::Associations::ClassMethods-label-Setting+Inverses
