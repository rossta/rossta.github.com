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

Since we’re calling `update.challenge` in the block, you may see an `N+1` generated as each `update` is now querying the DB for its `challenge`.

One solution is to just pass the `challenge` block:

```ruby
challenge.updates.map { |up| challenge.title }
```

and this may work in a pinch. the problem is, we have to remember to pass in the extra reference whenever it’s needed

There’s a better way!

When this N+1 happens on `has_many` assocation referencing their `belongs_to` instance, it means we’re missing the `inverse_of` option on the association(edited)

the fix, in this case, is:

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

No more `N+1`

I’m not entirely sure why `inverse_of` isn’t the default behavior… it could be for legacy reasons

http://api.rubyonrails.org/classes/ActiveRecord/Associations/ClassMethods.html#module-ActiveRecord::Associations::ClassMethods-label-Setting+Inverses
