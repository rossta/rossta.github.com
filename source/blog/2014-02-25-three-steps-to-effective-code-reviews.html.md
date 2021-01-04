---
title: Three Steps to Effective Code Reviews
summary: Exchanging feedback doesn't have to be painful
description: Exchanging feedback doesn't have to be painful
author: Ross Kaffenberger
published: true
pull_image: 'blog/stock/logs-pexels-photo.jpg'
category: Code
tags:
  - Process
---

These days, software developers are living in a [GitHub Workflow][gh-workflow]</a> world. They develop new code on version-controlled [branches][branches] and gather feedback prior to inclusion in the primary release, or “master” branch, through [pull requests][pull-requests].

[gh-workflow]: http://scottchacon.com/2011/08/31/github-flow.html
[branches]: http://git-scm.com/book/en/Git-Branching-Basic-Branching-and-Merging
[pull-requests]: https://help.github.com/articles/using-pull-requests

Our development team at ChallengePost has been using this workflow for almost two years with great success, although we&#8217;ve had our share of pain points. For better or worse, feedback typically happens asynchronously and is in written form. Convenient, yes, although this approach is not free of the wrinkles, especially when we use poor word choice, hyperbole, sarcasm, and other forms of counterproductive commentary.

This has led to resentment and injured relationships on occasion. In response, I’m working to improve how we give and receive criticism.

### Building trust

Let&#8217;s assume that, when done well, code reviews are a good thing. That is to say, the practice of giving and receiving feedback in a consistent, continual manner has true benefits. These may include improving code quality over time and driving convergence of ideas and practices within your team. In my experience, for feedback to be effective, trust amongst team members is a key requirement.

This may not be an issue for teams that have been together for a long time or share common values, but for others, trust has to be earned. In the absence of trust, there&#8217;s more opportunity for personal differences to get intertwined with feedback. While there are no quick fixes, what follows are code review practices that we have adopted to foster our shared sense of trust.

### 1. Adopt a style guide

**Spoiler alert**: code syntax and formatting are trivial choices. What&#8217;s most important is your team agrees on and adheres to a set of guidelines.

Take a few hours as a team to hammer out a style guide for each of the languages you use. Better yet, use a public example like [GitHub&#8217;s style guide][style-guide] as a starting point. Besides the obvious benefits of consistency and maintainability, style guides reduce the likelihood of flared tempers during reviews; when you’re pushing to get a new feature out the door, it&#8217;s unhealthy to argue over whitespace. This works when your team respectfully follows and comments on style issues respectfully, saving concerns about existing guidelines for separate discussions.

[style-guide]: https://github.com/styleguide

### 2. Start with the end in mind

Imagine a developer who emerges, after hours or days off in the “zone,” with a sparkly new feature and asks for a review. All is good, right? Except that the rest of the team has issues with the implementation. Words are exchanged, the developer takes the feedback personally, and suddenly the entire team is distracted from shipping code.

Personally, I believe code review should begin well before the final commit. It can happen early on; in short discussions with teammates once the ideas start to take shape. Get buy-in on your approach before you’re ready to merge your branch. Opening a pull request and asking for feedback while work is still in progress is a great way to build trust between teammates, and reduce the likelihood that criticism may be interpreted as a personal attack.

### 3. Use the Rubber Duck

[Rubber duck][rubber-duck] debugging is a method of finding solutions simply by explaining code line-by-line to an inanimate object. We&#8217;ve found it helps to do the same with our writing, especially when our first instinct is to respond to code or another comment with sarcasm or anger. Take a moment to read your response aloud and question the wording, timing, and appropriateness. This includes taking into account the personality of the team members you’re addressing. [Thoughtbot][thoughtbot] has compiled a useful set of [code review guidelines][guidelines] to help both readers and writers respond thoughtfully. I also suggest that teammates share meta-feedback to ensure that everyone is hitting the right notes of tone and instruction.

[rubber-duck]: http://en.wikipedia.org/wiki/Rubber_duck_debugging
[thoughtbot]: http://thoughtbot.com
[guidelines]: https://github.com/thoughtbot/guides/tree/master/code-review

The next time you feel pain in a code review, take a step back to consider what’s missing. It could be that your team needs to adopt some guidelines to reduce friction and ensure feedback is exchanged in as a constructive and positive manner as possible. After all, you have both code and relationships to maintain.

### Resources

* [Community ruby style guide](https://github.com/bbatsov/ruby-style-guide)
* [GitHub style guide](https://github.com/styleguide)
* [Code reviews: Good idea / bad idea?](http://mdswanson.com/blog/2012/11/04/code-reviews-good-idea-bad-idea.html)
* [Why I Love Code Reviews](http://code.dblock.org/why-i-love-code-reviews)
* [Code Review, Code Stories](http://whilefalse.blogspot.com/2012/06/code-reviews-code-stories.html)
* [How we use pull requests to build GitHub](https://github.com/blog/1124-how-we-use-pull-requests-to-build-github)
