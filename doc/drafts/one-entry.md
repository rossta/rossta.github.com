### A Simple Rule

Is your Webpacker compilation taking forever? You may be overpacking.

Your project may very well need more than one entry besides the typical `application.js`. However, treating every module in your application as an entry is most likely a mistake.
Your project may need want a separate entry for `admin.js` to import functionality for the admin pages of the site. You may further split up your entries across pages more aggressively, i.e., `page1.js`, `page2.js`, etc.

Be good to yourself and stick to this rule: **one entry per page**.

If you use the same JS on every page, then using a single `application.js` entry for every page on the site satisfies the rule.

However, treating every module in your application as an entry is most likely a mistake. Pay attention to what you're putting in the "packs" directory with Webpacker.

> Don't overpack. At best, this is wasteful; at worst, this is a productivity killer.
