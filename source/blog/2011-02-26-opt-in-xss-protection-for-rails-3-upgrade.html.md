---
title: Opt-in XSS protection for Rails 3 upgrade
author: Ross Kaffenberger
summary: A useful technique for upgrading ERB templates in Rails 3
pull_image: 'blog/stock/logs-pexels-photo.jpg'
category: Code
tags:
  - Ruby
---
When I’m really hungry, all I want is a Chipotle burrito. It seems like a good idea – it’s big, it tastes good and it’s right there across the street! It’s not long before I regret taking on that much food in one sitting. So it goes for upgrading [Weplay][1] to Rails 3.

A fundamental shift in Rails 3 is html escaping by default. A number of posts describe the need for this change, an important tool against cross-site scripting (XSS) attacks. Rather than rely on developers to escape user content where needed, all strings that don’t originate from Rails (link_to, form_for, etc.) are treated as unsafe. This is a good thing. Unfortunately, for most running Rails 2 apps, automatically html-escaping our views without adjustments results in a hot steaming pile of onscreen view-source dung.

This is exactly what you see the first time you install the recommended [rails_xss][2] plugin to provide Rails 3 XSS protection for your Rails 2 app. Despite the obvious work entailed to get things back to normal, this is another good thing. Making the switch to Rails 3 overnight may not be feasible, but adding XSS protection ahead of time will help smooth the transition.

Except perhaps when your app is large. At the present count, we have over 1500 \*.html.erb files in Weplay’s main repo. We simply can’t afford to devote the days to focus solely on fixes for excess html escaping in our templates. We need to be able to iterate on this change like everything else; incrementally instead of as an overhaul.

We came up with an alternative: [we forked rails_xss][3] to *disable* automatic html escaping by default while still providing the use of “html safe” strings and the Erubis ERB template engine. Developers can turn on html escaping locally using the **autoescape** block helper.

Everything within the helper is escaped. Anything outside the helper is not escaped. Nesting autoescapes is ok: everything inside the outermost invocation is escaped.

The autoescape helper allows us to apply the fixes on a view-by-view basis. We can devote most of our time to building features to help us make money and chip away at templates and partials as they pop up in our workflow. We even have a script to tell us how many files we still need to address.

The key to this change is manipulating the original rails_xss plugin behavior. Rails 3 helpers are composed of the String subclass [SafeBuffer][4], which will escape concatenated content not already marked as “html safe”. Internally, calling .html_safe on a string simply sets a flag on the string object and this is flag is checked when adding to a string to SafeBuffer. By monkey-patching String, we disable the automatic escaping by always returning true for the html_safe? check. The autoescape flips on the flag, yields to the content block and flips the flag check back off afterwards. When autoescaping is already turned on, the block is returned as-is to allow nested autoescaping.

There are alternatives. We could all crash on the upgrade (no time!) or we could keep the fully “escaped” version of our app in a separate branch, chip away at it, merge occasionally (not fun!).

The opt-in approach works well for our agile mindset of fast incremental improvement and frequent deployment. I recommend using our fork if you have similar needs. It may even help with the heartburn.

Resources

* [rails/rails_xss][5]
* [weplay/rails_xss][6]
* [Safe Buffer][7]

[1]:	http://www.weplay.com
[2]:	https://github.com/rails/rails_xss
[3]:	https://github.com/weplay/rails_xss
[4]:	http://yehudakatz.com/2010/02/01/safebuffers-and-rails-3-0/
[5]:	https://github.com/rails/rails_xss
[6]:	https://github.com/weplay/rails_xss
[7]:	http://yehudakatz.com/2010/02/01/safebuffers-and-rails-3-0/
