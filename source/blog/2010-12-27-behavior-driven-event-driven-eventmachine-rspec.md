---
title: How to Test Your Eventmachine Code with RSpec
author: Ross Kaffenberger
excerpt: >
  A walkthrough example of testing a server-client socket connection through
  eventmachine with rspec.
permalink: /2010/12/behavior-driven-event-driven-eventmachine-rspec/
tags:
  - Code
---
With all the hubbub around [node.js][1] lately, it’s been easy to forget established event-driven server-side processing solutions in Ruby. One option is [eventmachine][2], which I recently used to develop a multi-player online sudoku game, [Sudokill][3], for my Heuristics class at NYU.

 [1]: http://nodejs.org/
 [2]: http://rubyeventmachine.com/
 [3]: http://playsudokill.com

As the game designer, I needed to build a game server that could easily handle multiple socket connections to player programs written by my classmates. Leveraging the event-driven nature of eventmachine, I was able to build a server that is fast, efficient and easy to maintain.

A commonly-cited drawback to event-driven programming is that it’s hard. For starters, we can easily wrap our heads around a procedural approach to a server connecting to a client:
`

Server waits for client 1
Client attempts to connect to server
Server accepts connection with client 1
Server tells client 1 to wait
Now server waits for client 2
Repeat as before and so on...

`

This pattern is familiar: like a cookbook recipe or instructions for building a model airplane, we are well-equpped to handle things one step at a time. With the event model, we think in terms of discrete behaviors instead of ordered steps. We need to identify important events and their responses:

`

Whenever a socket connection is received, say hello
Whenever a message through a socket connection, process it
Whenever a socket connection disconnects, say goodbye

`

This model is common for front-end development (e.g. onclick, onmousever, etc.), but the notion of attaching events is not restricted to writing javascript for the DOM. Eventmachine provides some out-of-box hooks for adding behavior to expected events, like accepting socket connections. It also provides methods for defining and triggering our own custom behaviors.

Speaking of behavior: what about behavior-driven development with eventmachine? Absorbing the conceptual leap to programming to events is one challenge, and now, the mechanics of writing tests for them present another.

Let’s consider how we would test a client player connecting to my game server through a socket. I’ll build a class called Server which will be responsible for starting the eventmachine when its #start method is called. When a socket connection is made, I want to add the new player to a list of players kept on the server and send the message “READY” back to the client.

How would we write an integration test for this with rspec? The test would have to start an instance of my server class and separately initiate a client socket connection. Once the connection is made, then the test assertions can be run. After some digging around, I found some good examples to follow in the Ilya Grigorik’s eventmachine-backed websocket server, [em-websocket][4]. Here’s the basic approach:

 [4]: https://github.com/igrigorik/em-websocket

An eventmachine process runs in a loop: once we start the loop, it will run forever until we trigger the event to stop the loop. All of our eventmachine code will happen in the event loop. We setup the loop by passing our code in a block to the [run][5] method:

 [5]: http://eventmachine.rubyforge.org/EventMachine.html#M000461



So in our test, we’ll create the event loop with EM.run and pass a block with our test code in which we can start the game server and the socket connection. Once the assertions have been made, we’ll call EM.stop to end the event loop. Otherwise, it would run forever; we’d never get to the next test!

An eventmachine socket server can be initiated with the [start_server][6] method. We’ll give this method a host and port where it will listen for clients.

 [6]: http://eventmachine.rubyforge.org/EventMachine.html#M000470

We’ll also use eventmachine’s [connect][7] method to make the client socket connection to the server. When a socket connection is made, eventmachine creates an instance of EventMachine::Connection which responds to certain methods representing different phases of the socket connection: after initialization, when a message is received, when the connection is broken, etc. EM.connect accepts a module or class inheriting from EventMachine::Connection which allows us to mix in our app or test logic to the connection.

 [7]: http://eventmachine.rubyforge.org/EventMachine.html#M000473

To take the place of a player client in the test, I’ve borrowed FakeSocketClient (which subclasses EventMachine::Connection) from the em-websocket test suite and defined it in my spec\_helper.rb. The fake client exposes attr\_accessors onopen, omessage and onclose that we’ll treat like callbacks in the test.



We’ll assign a proc to the #onopen callback in FakeSocketClient. This proc will be triggered the first time the client socket receives a message. Since we want to the server to send a message when the connection is established, we expect this message to be “READY”. In addition, we’ll assert that there is one player added to the server’s list of players. Then we stop the event machine.



The key for making our rspec assertions: the socket connection between the server and client is accepted after the rest of the code in the EM.run block has been called. The instance FakeSocketClient receives #initialize and #post_init when EM.connect is called, but then the context returns to our test: we can now assign procs to FakeSocketClient’s onopen, onmessage and onclose callbacks as needed.

The #start method of our server is straightforward. It must start its own event loop and call EM.start_server previously discussed:



Other tests may include multiple client connections where we may need to assert that different messages like “YOUR TURN” and “WAIT YOUR TURN” are sent to the correct players.

For more reading on the subject of event programming, I recommend [Dabek, et.al, Event-driven Programming for Robust Software][8].

 [8]: http://pdos.csail.mit.edu/~rtm/papers/dabek:event.pdf
