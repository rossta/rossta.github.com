---
title: Ruby, You Autocomplete Me
author: Ross Kaffenberger
summary: Hacking on a smarter ruby console
published: true
tags:
  - Code
- Ruby
---

My team recently added a tagging feature to our web app. As the user types in
the text input, the app supplies autocomplete suggestions from our database via
javascript; a familiar UX. While backporting tags to existing records on the
`rails console`, it hit me: "Why not bring tag autocompletion to the command
line?"

The default `rails console` provides completion out-of-the-box though all the script
does is start `irb` with the rails environment and `irb/completion` required.

\`\`\`ruby
# !/usr/bin/env ruby
require File.expand\_path('../../load\_paths', __FILE__)
require 'rails/all'
require 'active\_support/all'
require 'irb'
require 'irb/completion'
IRB.start

# from https://github.com/rails/rails/blob/master/tools/console
\`\`\`

Turns out that all `irb/completion` does is configure the ruby interface to the
[GNU Readline Library][1].
This is done with the ruby [Readline][2]
module. `Readline` accepts a `proc` that determines completion behavior by returning an array of string
candidates given an input string triggered, typically, by pressing `TAB`.

From `irb/completion`:

\`\`\`ruby
if Readline.respond\_to?("basic\_word\_break\_characters=")
# Readline.basic\_word\_break\_characters= " \t\n\"\\'\`\>\<=;|&{("
  Readline.basic\_word\_break\_characters= " \t\n\`\>\<=;|&{("
end
Readline.completion\_append\_character = nil
Readline.completion\_proc = IRB::InputCompletor::CompletionProc
\`\`\`
`IRB::InputCompletor::CompletionProc` is a proc that evaluates a large case
statement of regular expressions that attempt to determine the type of given
object and provide a set of candidates to match, such as `String` instance methods when
the input matches `$r{^((["']).*\2)\.([^.]*)$}`.

To give `Readline` a spin, fire up `irb` and paste in the following example, borrowed
from the [ruby docs][3]:

\`\`\`ruby
require 'readline'

LIST = [
  'search', 'download', 'open',
  'help', 'history', 'quit',
  'url', 'next', 'clear',
  'prev', 'past'
].sort

comp = proc { |s| LIST.grep(/^#{Regexp.escape(s)}/) }

Readline.completion\_append\_character = " "
Readline.completion\_proc = comp
\`\`\`

There's nothing stopping us from taking this to the `rails console` to take
advantage of our rails environment and even access the database. Building off
the example, we can replace the hard-coded array with a list of tags plucked
from a simple activerecord query:

\`\`\`ruby
require 'readline'

comp = proc { |s| ActsAsTaggableOn::Tag.named\_like(s).pluck(:name) }

Readline.completion\_proc = comp
\`\`\`
We have room for improvement. For one thing, this makes a new query every time
you attempt to autocomplete. For a reasonable number of tags, we could load the
tag list in memory and grep for the matches instead. There is still another problem;
by replacing the `Readline.completion_proc`, we've clobbered the functionality
provided by `irb/completion`. One approach would be to fall back to the
`IRB::InputCompletor::CompletionProc` or add its result to the array of candidates.
Given IRB has documented, [incorrect completions][4]
(try completing methods on a proc) and no built-in support for extending completion behavior,
this could get messy.

Enter [bond][5], a drop-in replacement for IRB
completion. It aims to improve on IRB's shortcomings and provides methods for
adding custom completions. To take advantage of Bond in the console:

\`\`\`ruby
require 'bond'
Bond.start
\`\`\`

Bond allows you to extend the strategies for autocompleting text with [the
`Bond.completion` method](https://github.com/cldwalker/bond/blob/master/lib/bond.rb#L21).
To set up a Bond completion, we need a condition and an action; when the condition is matched,
then the given action will determine which candidates are returned. Calling
`Bond.start` will register Bond's default completions. For example, the
following completion is triggered with the text for completion starts with a
letter preceded by "::"; the search space is scoped to `Object.constants`.

\`\`\`ruby
# https://github.com/cldwalker/bond/blob/master/lib/bond/completion.rb#L13
complete(:prefix=\>'::', :anywhere=\>'[A-Z][^:\.\(]\*') {|e| Object.constants }
\`\`\`

To add tag autocompletion whenever we start a new string, we could use the following:

\`\`\`ruby
include Bond::Search # provides methods to search lists

TAG\_NAMES = ActsAsTaggableOn::Tag.pluck(:name) # load tag names in memory

Bond.complete(:name=\>:tags, prefix: '"', :anywhere=\>'([A-Z][^,]\*)') {|e|
  tag = e.matched[2]
  normal\_search(tag, TAG\_NAMES)
}
\`\`\`

Boom! Now we when autocomplete with some text inside an open double-quote, matching
tags from the database appear on the console.

\`\`\`
irb(main)\> "Face[TAB]
Face++                     Facebook Graph             FaceCash
Face.com                   Facebook Graph API         FaceDetection
Facebook                   Facebook Opengraph         Facelets
Facebook Ads               Facebook Real-time Updates Faces.com
Facebook Chat              Facebook SDK               Facetly
Facebook Credits           Facebook Social Plugins
irb(main)\> "Facebook", "Twit[TAB]
Twitcher          TwitLonger        Twitter           Twitter Streaming Twitxr
TwitchTV          TwitPic           Twitter API       TwitterBrite
TwitDoc           TwitrPix          Twitter Bootstrap TwitterCounter
Twitgoo           Twitscoop         Twitter Grader    Twittervision
Twitlbl           TwitSprout        Twitter Oauth     Twitvid
\`\`\`

Even though we ended up leveraging an existing gem, digging into the
Ruby standard library source code proved to be a useful exercise, revealing some
simple ways to hook into features easily taken for granted.

[1]:	http://cnswww.cns.cwru.edu/php/chet/readline/rltop.html
[2]:	http://www.ruby-doc.org/stdlib-1.9.3/libdoc/readline/rdoc/Readline.html
[3]:	http://www.ruby-doc.org/stdlib-1.9.3/libdoc/readline/rdoc/Readline.html
[4]:	https://github.com/cldwalker/bond#irbs-incorrect-completions
[5]:	https://github.com/cldwalker/bond