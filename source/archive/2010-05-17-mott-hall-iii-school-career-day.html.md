---
title: Mott Hall III School Career Day
author: Ross Kaffenberger
summary: Helping out at Career Day at Bronx middle school
description: Helping out at Career Day at Bronx middle school
thumbnail: 'blog/stock/logs-pexels-photo.jpg'
category: Life
tags:
  - JavaScript
---
As Calvin was leaving the classroom, he turned back toward me with a smile and a glint in his eye. That was all I needed to see to know: the lesson had made an impression. As a teacher, nothing beats that feeling. I could sense he wanted to say something; he was looking for the right words. He then told me about a website he knew of where he wanted to try more on his own.

A friend at the [Mott Hall III in the Bronx][1] invited me to speak at the school’s career day this past Friday. I may have been slow to respond, but as a former teacher myself, I knew this was one opportunity I could not pass up.

Mott Hall III is a not a typical public school school. At some 320 students in grades 6 through 8, it’s small. Students are admitted by application. There is an air of curiosity and respect that accompanies a school where students are held to high expectations.

I was one of about twenty speakers to speak with four groups of students for 30 minutes at a time. I wasn’t sure how to present until I learned I was offered the computer lab. I couldn’t resist: I would have students write a computer program.

Having left myself only a day to put something together, I decided it would be easiest for students to access a web page with a javascript console where we could walk through a few commands. Visual feedback would be key. There are some great in browser javascript consoles that came to mind: [jconsole][2] comes to mind. But the console needed a visual aspect&emdash;something to manipulate and see results. As I had done for many lessons as a teacher for years, I decided to roll my own.

The [JavaScript Playground][3] was born. Dirt simple, but effective for a short lesson, it is intended to be a lightweight introduction to using javascript. For career day, my aim was simply to have the students dip their toes in the process. Maybe experience a setback and (hopefully) find success. They would enter middle school students and leave computer programmers.

I put together a Keynote presentation to introduce the lesson and help students see why software engineers and computer programmers were relevant as builders of software for familiar technology like iPhone Apps, Facebook and Twitter. A segment I called “Computers are Dumb”, (common responses: Wha’? and Huh?) was inspired by my colleague [Noah Davis][4], who had done something similar for his own career day talk. I pretended to be a walking, listening computer who needed instructions to get around desks from one side of the room to the next. I let students shout out instructions which initially led to some comical results. “Turn right” resulted in my spinning in an endless loop and “Walk straight” usually ended with me walking into a wall or chair. The point: computers will do exactly what we tell them to do, not always what we *think* we’re telling them to do. This was important prelude to the playground.

We then turned our attention to the computers. Once I had led them to the playground and introduced a few commands, within minutes, they were hiding, showing, fading, and moving “Player 1″, a 50×50 pixel image of me. To keep things simple, I made [jQuery][5] available and loaded the console textarea with the player one selector prefilled: `$("#player1")`

I would demonstrate a command like

`$("#player1").hide()`

or

`$("#player1").fadeOut()`

and many students were quick to discover the complements: `.show()` and `.fadeIn()`. The real challenge for the ten minute lesson was to *move* player 1 from one corner of the screen to the “Home” area.

I could have used the `.animate()` function with options for manipulating `top` and `left` properties, but to simplify things, I wrote a more literal plugin `$.fn.move(x, y)` as a wrapper around `animate`. The `move` command simple takes x and y coordinates as paramaters&emdash;something I could tell was familiar for them from their math classes. While `move` added the x and y values to their current position, `$.fn.goto(x, y)` was introduced to jump directly to a place on (or off) the screen. It wasn’t long before the experimentation had begun. A few students figured out how to run multiple commands at once, some even used chained commands on their own: `$("#player1").fadeOut().fadeIn()`. Students were soon signaling me to show how they had led player 1 home.

At each of the sessions, I never seemed to leave enough time for questions. I encouraged students to return to this blog to post comments. I hope I was able to make computer programming a little more accessible and enjoyable for these motivated students in the Bronx. I may have even caught a bit of the teaching bug again myself.

[1]:	http://schools.nyc.gov/SchoolPortals/09/X128/default.htm
[2]:	http://www.jconsole.com/
[3]:	/js-playground/
[4]:	http://boxornot.com/2008/07/21/how-i-became-a-programmer/
[5]:	http://jquery.com/
