---
title: Why I Ditched Wordpress for GitHub
author: Ross Kaffenberger
summary: Moving my blog to a static website tool hosted on GitHub
description: Moving my blog to a static website tool hosted on GitHub
thumbnail: 'blog/stock/logs-pexels-photo.jpg'
category: Life
tags:
  - GitHub
---

By statistics alone, Wordpress is a winner. According to the [stats on Wikipedia][1], it is a clear favorite amongst the top and new websites worldwide. The sheer volume of options for plugins, themes and customizations are enough to make it worthwhile as a content platform; the admin tools make editing and publishing a breeze.

And yet, yesterday, I ditched Wordpress. This site is now hosted on [Github Pages][2].

So why switch? There are a few reasons. For one, site performance benefits of Pages over Wordpress have been [well-documented][3]. Now I don't have to worry about [Bluehost suspending my service][4] anymore. Pages is free. There's also my personal distaste for PHP, though it hasn't stopped me from hacking on my pages here and there.

There is, however, a more fundamental reason, illustrated when I ran into a close friend recently. My friend is brilliant and well-regarded in his field (finance). When he remarked on that fact that I had built my own website, my first thought was "Well, not really...", though I said something more like "Thanks!" My friend and most people don't care if a website runs on Wordpress, Django, .Net or C#... but I do. If the general sentiment on Hacker News is any indication, most developers care as well. Many of us got into programming because we saw something that amazed us and we desperately wanted to know *how*.

To host on Github Pages means for me [using git][5], hand-crafting html and writing markdown in my editor of choice, building with [tools][6] written in languages I love, and rolling my own theme built on [CSS frameworks][7] I like. It's a better representation of what I do and how I prefer to do it. Using Wordpress has always felt a bit disingenuous. And that's why I made the change.

[1]:	http://en.wikipedia.org/wiki/WordPress
[2]:	http://pages.github.com/
[3]:	http://mbmccormick.com/2011/10/ditching-wordpress-for-jekyll-and-github/
[4]:	http://go.janleow.com/2011/06/my-wordpress-website-in-bluehost-is.html
[5]:	https://help.github.com/articles/creating-project-pages-manually
[6]:	http://jekyllrb.com/
[7]:	http://foundation.zurb.com/
