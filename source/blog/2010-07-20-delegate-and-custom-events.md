---
title: $.delegate and Custom Events
author: Ross Kaffenberger
summary: Use event delegation to attach javascript callbacks
permalink: /2010/07/delegate-and-custom-events/
tags:
  - Code
- Javascript
---
Sharing team photos and video is central to [Weplay][1] and my team has been working hard recently to make some dramatic improvements to the media gallery experience.

One area in dire need of attention was the ability to edit photo metadata easily: changing captions, deleting pictures, moving from one album to another, etc. A user was forced to submit changes for up to sixty photos at a time with one post request. The response was slow and the potential for losing lots of changes was unacceptable.

We committed to swapping this experience with a more user-friendly ajaxified set of interactions. Each change is saved as you go and the updates take place in line. A key component of our front-end javascript is use of [jQuery][2]‘s `$.delegate`, available as of jQuery 1.4.2, and custom events.

I put together a brown bag presentation for my team explaining the benefits of $.delegate and custom events, currently available at .

The slides are written in markdown and presented using Scott Chacon’s excellent [showoff][3], which allows the embedding of printed, executable javascript. Note: since showoff ships with jQuery 1.4.0, the `$.delegate` examples are not currently executable.

[1]:	http://www.weplay.com
[2]:	http://jquery.com/
[3]:	http://github.com/schacon/showoff