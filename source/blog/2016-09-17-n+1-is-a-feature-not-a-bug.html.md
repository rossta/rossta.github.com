---
title: N+1 is a Feature, not a Bug
author: Ross Kaffenberger
published: false
summary: N+1 is a Feature, not a Bug
description: N+1 is a Feature, not a Bug
pull_image: 'blog/stock/louvre-pexels-photo.jpg'
series:
category: Code
tags:
  - Rails
---

One of the many mantras one learns on the path to "Rails enlightenment" is:
BEWARE OF THE N+1 QUERY!

To refresh, an N+1 query occurs when N additional rows are queried separately for each (1) resource. For example, if (Example)

Here's the evidence of the N+1 query in the Rails log.

Do a quick search for [N+1 Rails](https://www.google.com/search?q=N%2B1+Rails&oq=N%2B1+Rails&aqs=chrome..69i57j69i60l2.2907j0j1&sourceid=chrome&ie=UTF-8) and all you see are "Problems", "Issues", etc. And just about every one of those posts will state that the Silver Bullet to solve this problem is Eager Loading. There is actually a gem [`bullet`](https://github.com/flyerhzm/bullet) that will automagically help resolve your N+1 issues with warnings and suggestions to use Eager Loading right in your logs.

At some point, we've all started to wonder why Rails doesn't figure out where we
need eager loading and insert those `includes` for us.

Now consider this. Back in April, [Nate Berkopec](http://nateberkopec.com/), author of [The Complete Guide to Rails Performance](https://www.railsspeed.com/) sat down and spoke with DHH to talk Rails performance. [Not 5 minutes in](https://youtu.be/ktZLpjCanvg?t=4m27s), DHH says this:

> N+1 is a feature

WTF? But all those articles!

Here's the rest of his point.

> One of the deliberate strategies are that things like N+1 is a feature, which is
> usually seen as a bug, right? if you have N+1 query it means you're executing
> one SQL query per element so if you have 50 emails in an inbox, that'd be 50
> SQL calls, right? That sounds like a bug. Well in a Russian doll caching setup, it's > not a bug, it's a feature. The beauty of those individual calls are that
> they're individually cached, on their own timeline, and that they're super-simple. Because the whole way you get around doing N+1 queries is you do joins; you do more complicated queries that take longer to compute, and tax the database harder. If you can simplify those queries so that their super-simple, but there's just more of them, well, you win if and only if you have a caching strategy to support that.

Now I don't agree with everything DHH says, but he has a point. N+1 is a feature
because it gives you the option to tackle complex pages with many separate
queries that can be cached (and subsequently not called at all) as opposed to
the broadly-recommended strategy of using potentially expensive join queries,
likely on each page request, regardless of caching strategies.

How about we illustrate this point with an example?

So the point of this article isn't to 💩 on eager loading - it's an important
tool to have in your toolbox - but to encourage Rails developers to consider
how N+1 allows an alternative like Russian Doll caching to be a potentially more effective solution to addressing bottlenecks in your Rails applications.

Don't go blindly removing all your `includes` statements so you can add cache blocks to your Rails templates either. As with any discussion of performance, profiling and benchmarking is a required step to performance-tuning so it's up to you to determine the best approach.

Just beware of silver bullets.
