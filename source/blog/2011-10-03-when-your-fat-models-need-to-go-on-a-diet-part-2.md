---
title: When Your Fat Models Need to Go on a Diet, Part 2
author: rossta
permalink: /2011/10/when-your-fat-models-need-to-go-on-a-diet-part-2/
tags:
  - Code
---
In [part 1][1] of this post, I talked about using modules to help break source code of large models into smaller, comprehensible pieces. As [Ariel Valentin][2] pointed out, we need to do more to lighten up the runtime memory footprint when large models are instantiated.

 [1]: http://www.rosskaff.com/2011/09/when-your-fat-models-need-to-go-on-a-diet
 [2]: http://blog.arielvalentin.com/ "XP in Anger"

Let’s imagine we have an application with a `User` model (might not be a stretch) and we’re building a page that loads a bunch of user gravatars. Our `User` model has accumulated a ton of attributes, but we may only need a limited set to render the gravatar properly. We might add a line like this in the controller action to select only the needed attributes:

```ruby
@users = User.select(%w[ id name gravatar_id ]).all
```

Perhaps to make this more readable, we’ll extract our select statement into a scope in the `User` model:


```ruby
# user.rb
scope :select_gravatar_attributes, select(%w[ id name gravatar_id ])

# controller action
@users = User.select_gravatar_attributes.all
```

We’ll incur less memory overhead during this action at runtime since the app won’t have to load as much data. The caveat is that our `@users` won’t have access to the data we left behind, so we need to take care only to call methods that rely on the data we have actually loaded. It would be easier to test our lighter users if we could treat them as a different type.

Applying the model-slimming refactoring we discussed in [part 1][3], we can extract gravatar related functionality into a `UserExtensions::Gravatar` module and create a `Gravatar::User` that inherits from our `User` model. Furthermore, we can change our `select_gravatar_attributes` to a `default_scope` in the subclass, so whenever we grab `Gravatar::User` from the db, it’ll have only the attributes we need. Our controller action would now look like this:

 [3]: http://www.rosskaff.com/2011/09/when-your-fat-models-need-to-go-on-a-diet/

```ruby
@users = Gravatar::User.all
```

To put our savings to the test, we can run some basic benchmark tests. I created a sample rails 3.1 app and created ~2000 users records in my development database and ran the `rails benchmarker` script to load all users both normally and as gravatars. Here are the results:

All users

![All users](/images/screenshots/user-perf-test.jpg)


All as gravatars

![All as gravatars](/images/screenshots/gravatar-user-perf-test.jpg)

The memory footprint for gravatar users is half of that for our ‘fat’ users. Obviously results will vary greatly depending on architecture, application and the attributes selected, but this anecdotal case demonstrates potential for some big wins in instantiating slimmer subclasses of your heavy models.
