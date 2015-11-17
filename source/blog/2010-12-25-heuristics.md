---
title: Heuristics
author: Ross Kaffenberger
summary: Applying Ruby to heuristics-based solutions to NP-hard problems in computer science
permalink: /2010/12/heuristics/
tags:
  - Ruby
- Web
---
I just completed another semester of grad school at NYU. Progress towards my computer science degree has been slow: this is my fourth year in the program. As a part-time student, one class at a time is all I can handle. This time, the course was [Heuristics][1], which by itself was more than almost anyone can handle.

At its core, the course is about solving puzzles. What is the shortest route that passes through all the cities ([Traveling Salesman][2])? How many injured people around the city can you pick up in your ambulances in time ([Ambulance Planning][3])? What strategy is best for winning more area than your opponents ([Voronoi][4])? Who’s the best match across these 30 personality traits (Dating Game)?

Most of these problems fall into the category called NP-hard, which may be roughly defined as the class of problems that are at least as hard as those that can be solved in non-deterministic polynomial time. The more useful way for us to think about the general definition is to say that there is a verifiable best answer to the problem, but it would be very difficult, perhaps impossible, to design a general approach that would find this solution quickly.

Our goal for each problem then was to apply an appropriate set of heuristics: strategies to estimate a solution that would come as close as possible to the best solution in a reasonable amount of time. Two minutes in fact. Every week then, we had write a program to solve a NP-hard problem in competition with our classmates. If the program didn’t run, we lost. If it went over the two minute time limit, we lost.

Most problems involved interacting with a server via sockets. One student was chosen as the “architect” each week. Instead of solving the problem, the architect created an interface and protocol for communicating with the player clients, and a GUI to display the game progress and results. Extra pressure came with this role: if the server didn’t work or if player clients had difficulty connecting, the competition would be a failure. I chose to be the architect for the final game of the semester, [Sudokill][5], a form of competitive Sudoku. I plan to write more about Sudokill in the near future.

By far, this course was the most difficult class I’ve taken in grad school, both conceptually and regarding the workload. At its peak, I spent 30-40 hours a week preparing for the Monday competition. This was often time spent in the early morning hours before and after work. By the end of the semester, fewer than 50% of students were completing their assignments on time. Despite the burden on my free time, this was also the most fun and rewarding class I’ve ever taken. It certainly helped that I was allowed to write my programs in Ruby; this is a rare opportunity in department where most of the faculty prefers Java and C .

I’ve posted my class solutions in a single project on github:


My code for the Sudokill game server:


Check out the game too:
[http://rosskaff.github.com/sudokill][6]
[Game rules][7]

[1]:	http://cs.nyu.edu/courses/fall10/G22.2965-001/index.html
[2]:	http://cs.nyu.edu/courses/fall10/G22.2965-001/travelingsalesman.html
[3]:	http://cs.nyu.edu/courses/fall10/G22.2965-001/ambulance.html
[4]:	http://cs.nyu.edu/courses/fall10/G22.2965-001/voronoi.html
[5]:	http://cs.nyu.edu/courses/fall10/G22.2965-001/sudokill.html
[6]:	http://rosskaff.github.com/sudokill/
[7]:	http://cs.nyu.edu/courses/fall10/G22.2965-001/sudokill.html