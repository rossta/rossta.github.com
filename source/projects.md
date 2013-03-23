---
title: projects
author: admin
layout: page
---
[![][2]][2]I previously worked at [Weplay][2], an online youth sports team platform and social community. We’ve grown to over 400,000 users on 25,000 teams across the country.Weplay teams have access to messaging, scheduling, recurring events, drill library, local sports news, activity distrubution, and group privacy controls.Some other notable features I’ve built include the team map visualization, media uploading and gallery, league management tools, color customization, user signup validation, inline-editing interfaces, team polling, and avataring.
I’ve played large roles in defining the product vision, providing customer support, evangelizing best practices for Javascript coding and testing, and improving front-end performance.

Tools: Ruby/Rails, mysql, redis, memcached, nginx, sphinx, unicorn, chef, jQuery, rspec, cucumber, webrat, jasmine

* * *

![][3]****[turfcasts.com][4] ****My friend Brenn got me into running not long after moving to New York. We’re both lifelong lovers of sport and we’ve shared many stories of athletic adventures and mishaps. [turfcasts][4]was born out of the desire to share our own sports stories with the world. I build, design and maintain the site, while Brenn does most of the podcasting. We’ve had a few guest contributors and are always looking for new talent.Tools: Rails 3, mysql, apache, passenger, capistrano, jQuery, rspec, cucumber, capybara, jasmine

* * *

![][5]**[terraling.com][6] **Professor Dennis Shasha at NYU recruited me to create a linguistics research tool. The vision is to provide a platform for linguists to make comparisons across a variety of attributes and properties of the world’s languages. Together with an undergrad developer, we built the site over a single semester and launched this past May, 2011. I continue to provide ongoing support.We devised a few database abstractions that would support a wide variety of use cases such as syntactic structures or phonetics. I engineered a multilevel search algorithm to filter results by a variety of potential inputs including linguistic properties, categories, keywords, parent and child relationships and examples.

Tools: Rails 3, mysql, apache, passenger, capistrano, jQuery, rspec, cucumber, capybara, jasmine

* * *

![][7]**[Sudokill][8]**, one of my favorite projects, is a realtime multiplayer Sudoku implementation. The interface designed to support human vs human over the web, computer vs computer via TCP, or human vs computer. I built the game for NYU heuristics students to compete with their own Sudokill “player” programs.The object of the game is to force the other player to make an invalid Sudoku move. Players take turn playing valid sudoku moves. Moves are valid as long as they don’t violate traditional sudoku configuration. Moves need not conform to the final solution of the board as in solitary Sudoku; in fact, the possibility of invalid states increases as more moves are made which diverge from the actual solution. The best strategies work reduce valid possibilities for the opponent based by looking ahead to future board states.

This project is particularly exciting to me as it leverages the HTML5 WebSocket protocol to make it possible to play the game in a web browser and communicate with a server in realtime using only HTML, CSS and Javascript on the front-end. I implemented a separate protocol to allow programs to connect to the server and play the game via TCP. Fellow students at NYU wrote computer “players” in a variety of languages (java, python, ruby, c ). The game also has some interesting features, such as configurable board density, an on-deck player queue, and a chat server.

I got an A on the assignment.

Tools: Ruby, eventmachine, em-websocket, jQuery, Raphael, rspec

* * *

[![][10]**soapbox**][10]
In August 2010, I created a simple in-browser PowerPoint-like application as an entry in the 10K Apart contest from [a list apart][10]. Contestants were challenged to use features of HTML5 to create front-end applications in less than 10K of code. Soapbox leverages HTML5 localStorage to save slides in stringified JSON for future use. Although my [my entry][11] didn’t win, it was a good experience to create something straightforward and useful under constraints and a tight timeline.
* * *

[![][13]**map-ready**][13]Map-ready was extracted from a Weplay Google map integration project. We wanted a way to visualize all the thousands of teams across Weplay in a visually compelling and performant manner. We decided on a roll-up approach where we would cluster closely located teams together as a single point on the map.Map-ready provides an abstraction for condensing thousands of mappable objects (which can be located via latitude-longitude coordinates) down to a smaller set of markers which represent the relative density and distribution of the original set. The clustering algorithm is somewhat configurable and allows for groupings of various sizes across bounding box coordinates and zoom level.
* * *

[![][14]**supersized**][14]Supersized is jQuery plugin for turning a set of images into a fullscreen, resizable media slideshow. It supports play, pause, forward, back, autoplay and number of custom events for hooking into any html interface.This is a good example of a project I forked and made significant improvements to. The original supersized project caught our attention at Weplay last year and we wanted to drop it in as an alternative way for our users to view their own photos. We found the original project to be lacking in providing support for configurable options and it was heavily tied to the DOM. We decided to rewrite it from scratch, adding a public api, callbacks to remove reliance on the DOM, and a full Jasmine unit test suite.
* * *

[heuristics][14]

 []: http://www.weplay.com
 [2]: http://www.weplay.com
 [3]: http://www.rosskaff.com/wp-content/uploads/2011/06/screenshot-turfcasts-home-300x198.jpg "screenshot-turfcasts-home"
 [4]: http://www.turfcasts.com
 [5]: http://www.rosskaff.com/wp-content/uploads/2011/06/screenshot-terraling-home-300x196.jpg "screenshot-terraling-home"
 [6]: http://terraling.com/
 [7]: http://www.rosskaff.com/wp-content/uploads/2011/06/screenshot-sudokill-300x237.jpg "screenshot-sudokill"
 [8]: http://rossta.github.com/sudokill/
 []: http://rossta.github.com/soapbox/
 [10]: http://www.alistapart.com/
 [11]: http://10k.aneventapart.com/Entry/361
 []: https://github.com/rossta/map_ready
 []: http://github.com/weplay/supersized
 [14]: http://github.com/rossta/heuristics

[sudoku-solver][15]

 [15]: http://github.com/rossta/sudoku-solver

[$.delegate and custom events][16]

 [16]: http://jsdelegate.heroku.com

[playground][17]

 [17]: http://www.rosskaff.com/wp-content/uploads/2010/05/playground.html
