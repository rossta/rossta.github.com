# frozen_string_literal: true

require "json"
require "lib/custom_markdown_renderer"
require "lib/custom_helpers"

# activate(:livereload)
activate(:meta_tags)

# activate :directory_indexes
# Time.zone = "UTC"
activate(:external_pipeline, name: :webpack, command: build? ? "yarn build:prod" : "yarn build:dev", source: ".tmp/dist", latency: 1)

###########################
## Blog
###########################
activate(:blog) do |blog|
  blog.name = "posts"
  blog.prefix = "posts"
  blog.permalink = "/{title}.html"
  blog.sources = "{year}-{month}-{day}-{title}.html"
  blog.layout = "post"
  blog.tag_template = "tag.html"
  blog.calendar_template = "calendar.html"
  blog.paginate = true
  blog.per_page = 25
  blog.default_extension = ".md"
  blog.custom_collections = {series: {link: "/series/{series}.html", template: "series.html"}}
  blog.publish_future_dated = true
end

###########################
## Archived Blog
###########################
activate(:blog) do |blog|
  blog.name = "archive"
  blog.prefix = "archive"
  blog.permalink = "/{title}.html"
  blog.sources = "{year}-{month}-{day}-{title}.html"
  blog.layout = "post"
  blog.tag_template = "tag.html"
  blog.calendar_template = "calendar.html"
  blog.paginate = true
  blog.per_page = 25
  blog.default_extension = ".md"
  blog.custom_collections = {series: {link: "/series/{series}.html", template: "series.html"}}
  blog.publish_future_dated = true
end

###########################
## Blog
###########################
activate(:blog) do |blog|
  blog.name = "blog"
  blog.prefix = "blog"
  blog.permalink = "/{title}.html"
  blog.sources = "{year}-{month}-{day}-{title}.html"
  blog.layout = "post"
  blog.tag_template = "tag.html"
  blog.calendar_template = "calendar.html"
  blog.paginate = true
  blog.per_page = 25
  blog.default_extension = ".md"
  blog.custom_collections = {series: {link: "/series/{series}.html", template: "series.html"}}
  blog.publish_future_dated = true
end

###########################
## Talks
###########################
activate(:blog) do |blog|
  blog.name = "talks"
  blog.prefix = "talks"
  blog.permalink = "/{title}.html"
  blog.taglink = "tags/{tag}"
  blog.sources = "{year}-{month}-{day}-{title}.html"
  blog.default_extension = ".md"
  blog.layout = "talk"
  blog.paginate = true
  blog.per_page = 25
end

###########################
## Projects
###########################
activate(:blog) do |blog|
  blog.name = "projects"
  blog.prefix = "projects"
  blog.permalink = "/{title}.html"
  blog.taglink = "tags/{tag}"
  blog.sources = "{year}-{month}-{day}-{title}.html"
  blog.default_extension = ".md"
  blog.layout = "project"
  blog.paginate = true
  blog.per_page = 25
end

set(:markdown_engine, :redcarpet)
set(:markdown, layout_engine: :erb, no_intra_emphasis: true, fenced_code_blocks: true, autolink: true, disable_indented_code_blocks: true, smartypants: true, lax_spacing: true, renderer: CustomMarkdownRenderer)
set(:css_dir, "assets/stylesheets")
set(:js_dir, "assets/javascripts")
set(:images_dir, "assets/images")
ignore("assets/stylesheets/*")
ignore("assets/javascripts/*")

# Disabled in favor of Webpack hashing
# activate :asset_hash
# Build-specific configuration
configure(:build) do
  set(:trailing_slash, false)
  set(:protocol, "https")
  set(:host, "rossta.net")
  set(:port, nil)
  set(:google_analytics_id, "UA-16458563-2")
  set(:mailchimp_form_id, "96030b0bda")
  activate(:gzip, exts: %w[.js .css .html .htm .svg .ttf .otf .woff .eot])
end

configure(:development) do
  set(:protocol, "http")
  set(:host, "localhost")
  set(:port, 4567)
  set(:google_analytics_id, "UA-xxxxxxxx-x")
  set(:mailchimp_form_id, "a57e354058")
end

###
# Page options, layouts, aliases and proxies
###
# Per-page layout changes:
#
# With no layout
page("/playground.html", layout: false)
page("/feed.xml", layout: false)
page("/sitemap.xml", layout: false)

redirect "webpack-on-rails/index.html", to: "index.html"

helpers CustomHelpers
