preferred_syntax = :scss

activate :livereload
activate :directory_indexes

# Time.zone = "UTC"

ready do
  sprockets.append_path File.join root, 'bower_components'
  sprockets.append_path File.join root, 'bower_components/foundation/scss'
  sprockets.append_path File.join root, 'bower_components/foundation/js'
  sprockets.append_path File.join root, 'bower_components/highlightjs'
  sprockets.append_path File.join root, 'bower_components/highlightjs'
end

activate :blog do |blog|
  blog.prefix = "blog"
  blog.permalink = "/:title.html"
  blog.sources = ":year-:month-:day-:title.html"
  # blog.taglink = "tags/:tag.html"
  blog.layout = "post"
  # blog.summary_separator = /(READMORE)/
  # blog.summary_length = 250
  # blog.year_link = ":year.html"
  # blog.month_link = ":year/:month.html"
  # blog.day_link = ":year/:month/:day.html"
  # blog.default_extension = ".markdown"

  blog.tag_template = "tag.html"
  blog.calendar_template = "calendar.html"

  blog.paginate = true
  # blog.per_page = 10
  # blog.page_link = "page/:num"
end

page "/feed.xml", :layout => false

set :css_dir, 'stylesheets'

set :js_dir, 'javascripts'

set :images_dir, 'images'

set :markdown_engine, :redcarpet
set :markdown, :layout_engine => :erb,
          :fenced_code_blocks => true,
          :autolink => true,
          :smartypants => true,
          :lax_html_blocks => true

# Build-specific configuration
configure :build do
  activate :minify_css
  activate :minify_javascript

  # Enable cache buster
  # activate :cache_buster

  # Use relative URLs
  # activate :relative_assets

  # Compress PNGs after build
  # First: gem install middleman-smusher
  # require "middleman-smusher"
  # activate :smusher

  # Or use a different image path
  # set :http_path, "/Content/images/"

  set :google_analytics_id, 'UA-16458563-2'
  set :mailchimp_form_id,   '96030b0bda'
end

configure :development do
  set :google_analytics_id, 'UA-xxxxxxxx-x'
  set :mailchimp_form_id,   'a57e354058'
end

configure :build do
end

###
# Compass
###

# Susy grids in Compass
# First: gem install susy
# require 'susy'

# Change Compass configuration
# compass_config do |config|
#   config.output_style = :compact
# end

###
# Page options, layouts, aliases and proxies
###

# Per-page layout changes:
#
# With no layout
page "/404.html", :layout => false
page "/playground.html", :layout => false
#
# With alternative layout
# page "/path/to/file.html", :layout => :otherlayout
#
# A path which all have the same layout
# with_layout :admin do
#   page "/admin/*"
# end

# Proxy (fake) files
# page "/this-page-has-no-template.html", :proxy => "/template-file.html" do
#   @which_fake_page = "Rendering a fake page with a variable"
# end

###
# Helpers
###

# Automatic image dimensions on image_tag helper
# activate :automatic_image_sizes

# Methods defined in the helpers block are available in templates
# helpers do
#   def some_helper
#     "Helping"
#   end
# end

helpers do
  def title_tag
    [].tap do |names|
      names << yield_content(:title)
      names << "Ross Kaffenberger"
    end.compact.reject(&:blank?).join(" | ")
  end

  def title
    yield_content(:title)
  end

  def section
    (yield_content(:section) || title || "")
  end

  def url_with_host(path)
    "http://rossta.net" + path
  end

  def email_url
    "mailto:ross@rossta.net"
  end

  def signup_form_url
    "//rossta.us6.list-manage.com/subscribe/post?u=8ce159842b5c98cecb4ebdf16&amp;id=#{settings.mailchimp_form_id}"
  end
end

