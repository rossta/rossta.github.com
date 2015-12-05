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
