#### A Webpacker CSS Gotcha

In your `config/webpacker.yml` file, you likely want this flag set in `production`:

```
extract_css: true
```

Meaning: for every javascript entry point, pull its imported css out into a separate css file by the same name.

When using `extract_css: true`, you'll need the stylesheet tag: `stylesheet_pack_tag 'application'`.

```
extract_css: false
```

Let webpack figure out the dependency graph. This can help, among other things, de-duplicate overlapping modules used on one page. Same goes for CSS.

Remember the rule from the previous section? "one entry point per page", i.e., "don't overpack".


> So you know what you're doing and you want to do this anyway? Great! Have at it. This post is for webpack(er) newbies, not you. I believe they'll be better off sticking to basics starting out.
