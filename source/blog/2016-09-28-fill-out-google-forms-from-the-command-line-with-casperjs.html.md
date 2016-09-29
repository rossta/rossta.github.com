---
title: Fill out Google Forms from the command line with CasperJS
author: Ross Kaffenberger
published: true
summary: Using CasperJS to automate webpage interaction
description: A tutorial for writing a CasperJS script to fill out a Google Form, which is also available now as an npm package called "form-to-terminal"
pull_image: 'blog/stock/coding-a-pexels-photo.jpg'
series:
category: Code
tags:
  - JavaScript
  - Node
---

To give you some idea about what a geek I am, when [Saron](https://twitter.com/saronyitbarek) asked me to fill out a form to submit blog posts to the
[CodeNewbie Newsletter](http://www.codenewbie.org/blogs/submit-to-the-codenewbie-newsletter), I thought, "what if I could automate that?". I happen to spend a lot of time in a terminal and thinking about webpage interaction, so...

Instead of filling out the form for my last article, I ended up creating a tool to fill out and submit a Google Form from the command line. At it's core, it's a [CasperJS](http://casperjs.org/) script available as an npm package
called [`form-to-terminal`](https://github.com/rossta/form-to-terminal).

To use `form-to-terminal`, install via npm and use the executable `ftt` with a
Google Form url to put it into action:

```bash
# Open a terminal and enter the following commands after the prompt ($):
$ npm install -g form-to-terminal
$ ftt [Google Form Url]
```

This assumes that you've already installed [nodejs](https://nodejs.org/en/download/package-manager/),  [CasperJS](http://docs.casperjs.org/en/latest/installation.html), and its pre-requisites.

## Casper, the friendly ghost

CasperJS is actually just a wrapper around [PhantomJS](http://phantomjs.org/), which provides
fully-featured API for interacting with webpages from JavaScript.

CasperJS makes this scripting more pleasant by providing some syntactic sugar for dealing
with multi-stage interactions and waiting for asynchronous actions. In other
words, I could've done this with just using PhantomJS, but the code I needed to
write got a whole lot easier by using the CasperJS module on top of it.

## A closer look

Let's look at some sample code; what follows are simplified excerpts of code
taken from the `form-to-terminal` CasperJS script.

Given a URL to a Google Form, first we `start` the webpage interaction, which waits to complete
before moving to the next step.

```javascript
var casper = require("casper").create();

casper.start(url, function() {
  this.waitForSelector("form");
});
```

To provide the command line interface with some context, the script parses the
page for the form title to display back to the command line.

```javascript
var formTitle;

casper.then(function() {
  formTitle = this.evaluate(getFormTitle);
});
```

Next, we want to allow human interaction with each input one-by-one, so we parse
the form for the text inputs and their labels so we can ask the user to enter answers back into the
terminal using `readLine`:

```javascript
var system = require('system');
var answers;

casper.then(function() {
  var page = this;
  page.echo("Please fill out " + formTitle);
  page.echo("----------------" + formTitle.length);
  answers = page.evaluate(getFormInputs)

  answers.filter(function(input) {
    return input.type == "text";
  }).map(function(input, i) {
    page.echo("");
    page.echo(""+(i+1)+") "+input.label+":");

    input.value = system.stdin.readLine();
t
    ireturn input;
  });
});m
```

Awesome! Now we just need to pass the `answers` back to the webpage and submit
the form. CasperJS makes it easy to do this with additional args to
`this.evaluate` in the `casper` context:

```javascript
casper.then(function() {
  this.evaluate(submitAnswers, {answers: answers});
  page.echo("");
  this.echo("Thanks!");
});
```

Check out the full [CasperJS script](https://github.com/rossta/form-to-terminal/blob/96a4dd8be4b071b5bfb5adb50676a6383c685240/index.js) to see how `form-to-terminal` interacts with Google Forms in more detail.

## Command line node

I wanted to make this work for others on the command line as an npm package. To
get this to work, we have to understand that `casperjs` is already its own
process. To make it work from `node`, I needed to spawn the `casperjs` while
passing arguments from node. I also needed to make sure that the `stdin`
stream is piped from parent (node) to the child (casperjs) process so that we our answers
for the form inputs end up on the web page.

The key pieces of the command line tool are shown below:

```javascript
const child = spawn('casperjs', ['index.js'].concat(urls));

child.stdin.setEncoding('utf-8');
child.stdout.pipe(process.stdout);
process.stdin.pipe(child.stdin);
child.on('exit', process.exit);
```

The `urls` represent the set of Google Form urls with which the CasperJS script
will interact. The line `process.stdin.pipe(child.stdin);` ensures the text we
enter on the command line is passed to CasperJS.

## Going further

`form-to-terminal` (as of version 1.0.1) only supports Google Forms and only
fully those with text inputs. It's likely quite buggy - for example, it doesn't
currently check that you've filled out all required fields, nor does it check
for validations errors after you've submitted the form - but, hey, it's a start.
Go ahead and [check it out on GitHub](https://github.com/rossta/form-to-terminal) and contribute some improvements!

CasperJS is a fun tool for automating your workflow and worth a look for
automated testing for web developers.

Of course, I submitted this post to the CodeNewbie Newsletter using
`form-to-terminal` - (how meta?) - it comes with a built-in shortcut to the
CodeNewbie Google Form so you can try it too:

```javascript
$ ftt codenewbie
```
