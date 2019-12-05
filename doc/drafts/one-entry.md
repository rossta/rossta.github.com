### A Simple Rule

Is your Webpacker compilation taking forever? You may be overpacking.

Your project may very well need more than one entry besides the typical `application.js`. However, treating every module in your application as an entry is most likely a mistake.

> Don't overpack. At best, this is wasteful; at worst, this is a productivity killer.

Be good to yourself and stick to this rule: **one entry per page**.
