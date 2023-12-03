---
title: A guide to NPM version constraints for Rubyists
author: Ross Kaffenberger
published: true
summary: Mind your carets and tildes
description: A reference guide to NPM version constraints for dependencies declared in the package.json file of a Rails project from the perspective of a Ruby developer familiar with similar conventions used to specify Ruby dependencies in a Gemfile.
thumbnail: 'blog/stock/lulu-blue-mountain-unsplash.jpg'
thumbnail_caption: Photo by 拴 张 on Unsplash
series:
category: Code
tags:
  - Rails
  - Webpack
  - JavaScript
type: Guide
---

In this post, I want to answer the following question for Rubyists:

> What do the tilde `~` and caret `^` designations mean for version constraints in a `package.json` file?

To answer this question, we'll compare how Rubyists declare Ruby project dependencies in a `Gemfile` with conventions used to declare NPM module dependencies in a `package.json` file.

Of note, some projects use both Gemfile and package.json. For example, a newly created Rails 6 application will have generated a package.json file because, by default, it ships with webpack and related NPM dependencies to compile JavaScript assets.

It might include a section like this:

```json
"dependencies": {
  "@rails/ujs": "^6.0.0",
  "@rails/webpacker": "~4.2.1",
},
```

If you're a Rubyist and the version syntax looks odd, then this post is for you.

> [Subscribe to my newsletter](https://buttondown.email/joyofrails), Joy of Rails, to get notified about new content.

## Version constraints in Gemfile

Like the `Gemfile`, package.json has a convention to specify version constraints. Both Ruby and NPM dependencies usually follow SemVer, that will format a constraint as `major.minor.patch`, i.e. the declaration `"webpack": "4.41.2"` indicates webpack major version 4, minor version 41, and patch version 2.

Where they differ is in the use of special characters to declare acceptable ranges. Let's refresh the conventions used in the Gemfile.

To lock a gem dependency to an exact version, we would declare the gem's name and its version as follows:

```ruby
gem "devise", "4.7.1"
```

A more optimistic constraint would be to provide an open-ended range that will install or update to a version of the gem that satisfies the range.

```ruby
gem "devise", ">= 4.7"
```

To limit the upper end of the range, say, to allow minor updates up to the next major version:

```ruby
gem "devise", ">= 4.7", "< 5"
```

This format has a shorthand notation, the squiggly arrow `~>`, or the pessimistic version constraint.

```ruby
gem "devise", "~> 4.7"
```

The upper end of the range is determined by the smallest level of the declared constraint. For example,

- `"~> 4.7.1"` matches `">= 4.7.1", "< 4.8.0"`
- `"~> 4.7"` matches `">= 4.7.0", "< 5.0.0"`
- `"~> 4"` matches `">= 4.0.0", "< 5.0.0"`

To specify "no constraint", simply omit the version argument.

```ruby
gem "devise"
```

For more info, check out [the guide on RubyGems](https://guides.rubygems.org/patterns/#declaring-dependencies).

## Version constraints in package.json

NPM conventions provide similar flexibility with alternate syntax.

Let's consider a package.json file that declares `@rails/webpacker` as a dependency, the following would enforce an exact version:

```json
"@rails/webpacker": "4.2.1",
```

As with the Gemfile, comparison operators can be used as in the following examples:

- `">=4.2.1"` matches greater or equal to 4.2.1
- `">4.2.1"` matches greater than 4.2.1
- `">=4.2.1 <5"` matches greater or equal to 4.2.1 and less than 5
- `"<5"` matches less than 5

NPM supports alternate syntaxes for specifying ranges, including, but not limited to, caret `^` and tilde `~`.

### Tilde ranges

> NPM ~ is like Gemfile ~>

Tilde ranges for NPM are equivalent to Ruby's pessimistic version constraint, the squiggly arrow `~>`. In other words, the upper end of the range is determined by the smallest level of the declared constraint:

- `"~4.2.1"` matches `">= 4.2.1 <4.3.0"`
- `"~4.2"` matches `">= 4.2.0 <5.0.0"`
- `"~4"` matches `">= 4.0.0 <5.0.0"`

### Caret ranges

> NPM ^ is like Gemfile ~> x.0 for versions 1 and up and ~> 0.x.0 for versions less than 1 and greater than 0.0.1

Caret ranges are another take on pessimistic version constraints that do not have a shorthand equivalent in Ruby, i.e., to my knowledge, they're a special breed. They allow patch and minor updates for versions `>1.0.0`, patch updates for versions `<1.0.0 >=0.1.0`, and no updates for versions `<0.1.0` (except preleases, e.g. `0.0.3-beta`). My understanding is that the caret is the answer for traditional SemVer, i.e., there will be breaking changes prior to 0.1.0, there may be breaking changes between minor versions prior to 1.0.0, and there may only be breaking changes between major versions above 1.0.0. Examples:

- `"^4.2.1"` matches `">=4.2.1 <5.0.0"` or `"~4.2"`
- `"^0.2.2"` matches `">=0.2.2 <0.3.0"` or `"~0.2.2"`
- `"^0.0.2"` matches `">=0.0.2 <0.0.3"`

## Bonus syntax in package.json

NPM also supports hyphen ranges and x-ranges, neither of which have Gemfile equivalents as well.

### Hyphen ranges

> NPM hyphen-ranges are like separate comparison operators in a Gemfile

For hyphen ranges, range inclusivity is tied to specificity of the declared versions:

- `"4.2.1 - 5.4.2"` matches `">=4.2.1 <=5.4.2"`
- `"4.2 - 5.4.2"` matches `">=4.2.0 <=5.4.2"`
- `"4.2 - 5"` matches `">=4.2.0 <=6.0.0"`

### X-ranges

> NPM x-ranges behave like Gemfile ~> with exceptions

X-ranges are mostly self-explanatory as the `x` denotes any value:

- `"4.2.x"` matches `"~4.2.0"` matches `">= 4.2.0 <4.3.0"`
- `"4.x"` matches `"~4.0"` matches `">= 4.0.0 <5.0.0"`
- `"4.x.x"` matches `"4.x"`

A partial version range is treated as an x-range:

- `"4.2"` matches "`4.2.x"`
- `"4"` matches "`4.x.x"`
- `""` matches "`*`" matches any version

## Conclusion

For Rubyists out there who needed an introduction to NPM version constraints, I hope this was a helpful guide, or perhaps a future cheatsheet.

Mostly I wrote this for myself because I tend to forget 😅.
