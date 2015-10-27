---
title: Push Data to Rails Client
author: Ross Kaffenberger
published: false
---

Topics:

Motivations
- better, timelier feedback

Server Sent Events
- response headers
- CORS

EventSource HTML5
- API
- [polyfill](https://github.com/Yaffle/EventSource)

Architecture
- Slow client/server, Push server, Pub/Sub mechanism
- Client/server + Push server: rails alone on thin/puma, node.js alone, rails +
  node.js
- Pub/Sub: Redis, RabbitMQ

Deployment

Photo upload

Resources

- [SSE by Remy Sharp](http://html5doctor.com/server-sent-events/)
- [SSE on HTML5Rocks](http://www.html5rocks.com/en/tutorials/eventsource/basics/)
- [SSE on Mozilla](http://www.html5rocks.com/en/tutorials/eventsource/basics/)
- [Node.js with Redis](http://code.tutsplus.com/tutorials/multi-instance-nodejs-app-in-paas-using-redis-pubsub--cms-22239)
- [Node.js with SSE](http://cjihrig.com/blog/server-sent-events-in-node-js/)
