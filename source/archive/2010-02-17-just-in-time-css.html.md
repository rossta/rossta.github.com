---
title: Just-in-Time CSS
author: Ross Kaffenberger
summary: Defer CSS requests to reduce payload size on initial page load
description: Defer CSS requests to reduce payload size on initial page load
thumbnail: 'blog/stock/logs-pexels-photo.jpg'
category: Code
tags:
  - CSS
---
On top of the list of [best practices for speeding up your website][1] is reducing the number of HTTP requests required to render the page. As our websites grow and there are more pages to style, we have more style rules to deliver to our visitors. Keeping the number of requests to a minimum usually means we either need to put all our styles in a single stylesheet, or use a bundling strategy such as [Jammit][2] or [Asset Trip][3], like we use at [Weplay][4], to pull our stylesheets together as one at deploy time.

One problem with the single CSS request approach is we often send CSS rules that our users don’t need to render the page initially or at any time during the current page view. This is like making dinner for 10 when only 2 people have RSVP’d; it can potentially be a big waste. In this wacky ajaxy world we live in, who says all your CSS needs to be on the page at load time? Consider using just-in-time CSS for page elements that aren’t necessary to display right away.

Let’s say we have a lightbox to display gallery images that is only rendered when a user clicks on a page link. The CSS rules needed to render the box shouldn’t have to be loaded during the initial request. We can pull these out into a separate stylesheet and load it on demand with javascript.

```javascript
// Demo
// Hello World

function require(url) {
  // logic to determine url is for a css file here
  var element = document.createElement("link");
  element.setAttribute("rel", "stylesheet");
  element.setAttribute("type", "text/css");
  element.setAttribute("href", url);
  document.getElementsByTagName("head")[0].appendChild(element);
  return this;
}

```

The code example defines a function ‘require’ that builds a stylesheet link tag and inserts it into the head of the document. The function is triggered as a callback from the onload event of the document body with a url to the ‘app.css’ file located in the same directory. Alternatively, we could attach the function call to a different event, such as click on a link to a popup that might need the styles.

The key is that the HTTP request is not made until the stylesheet tag is appended to the document head tag after the page has already loaded. We decrease the number and/or size of the requests needed to render the page initially keeping our visitors satisfied.

[1]:	http://developer.yahoo.com/performance/rules.html
[2]:	http://documentcloud.github.com/jammit/
[3]:	http://github.com/brynary/asset-trip
[4]:	http://www.weplay.com
