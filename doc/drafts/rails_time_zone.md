Thanks for asking these questions. Yes, mysql dates represent UTC but don't actually store any time zone info - Rails will just always convert timestamps to the literal format, e.g., "2016-01-08 12:00:00", and assume UTC. When deserializing into Active Record, Rails reads timestamp columns into current time zone *depending on the time zone in the current execution context*. What?

The `Time.zone` class is a singleton determined by the time zone set in `config/application.rb`. For us, it's EST:

```ruby
# config/application.rb
config.time_zone = 'Eastern Time (US & Canada)'

Time.zone.now # => Fri, 08 Jan 2016 11:00:12 EST -05:00
Time.zone.name # => "Eastern Time (US & Canada)"
```

Now, ActiveRecord timestamps are not `Date`, `Time`, or `DateTime` objects; they're instances of `ActiveSupport::TimeWithZone` You can augment their time zones with methods like `#in_time_zone`:

```ruby
challenge.submissions_start_at
# => Sat, 05 Mar 2016 12:00:00 EST -05:00
challenge.submissions_start_at.in_time_zone("Pacific Time (US & Canada)")
# => Sat, 05 Mar 2016 09:00:00 PST -08:00
```

There's another way. The `Time.use_zone` method overrides the global `Time.zone` singleton locally inside a supplied block and resets `Time.zone` to existing value when done:

```ruby
Time.use_zone("Pacific Time (US & Canada)") do
  Time.zone.name # => "Pacific Time (US & Canada)"
  Time.zone.now # => Fri, 08 Jan 2016 08:11:26 PST -08:00
end

Time.zone.name # => "Eastern Time (US & Canada)"
Time.zone.now # => Fri, 08 Jan 2016 11:11:26 EST -05:00
```

We use this trick in the manage area to ensure that time zones are always read and written from the **challenge's configured time zone** through the context of the entire request:

```ruby
# groups/application_controller.rb
    append_around_filter :use_challenge_time_zone

    # Use of challenge time zone will occur when setting @challenge before
    # this around filter is run. Typically this means in the controller:
    #
    # prepend_before_filter :find_challenge
    #
    def use_challenge_time_zone(&block)
      if @challenge
        Rails.logger.info "Time zone: #{@challenge.time_zone} for Challenge##{@challenge.id}, #{@challenge.title}"
        Time.use_zone(@challenge.time_zone, &block)
      else
        Rails.logger.info "Time zone: #{Time.zone.name}"
        yield
      end
    end
```
