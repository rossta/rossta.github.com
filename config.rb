activate :livereload
activate :directory_indexes
activate :meta_tags

# Time.zone = "UTC"

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

set :markdown_engine, :redcarpet
set :markdown, :layout_engine => :erb,
          :fenced_code_blocks => true,
          :autolink => true,
          :smartypants => true,
          :lax_html_blocks => true

set :css_dir, 'assets/stylesheets'
set :js_dir, 'assets/javascripts'
set :images_dir, 'assets/images'

# Build-specific configuration
configure :build do
  activate :minify_css
  activate :minify_javascript

  # Enable cache buster
  activate :cache_buster

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

compass_config do |config|
  # Require any additional compass plugins here.
  config.add_import_path "bower_components/foundation/scss"

  # Set this to the root of your project when deployed:
  config.http_path = "/"
  config.css_dir = "stylesheets"
  config.sass_dir = "stylesheets"
  config.images_dir = "images"
  config.javascripts_dir = "javascripts"
end

after_configuration do
  @bower_config = JSON.parse(IO.read("#{root}/.bowerrc"))
  sprockets.append_path File.join(root, @bower_config["directory"]).tap { |f| puts "file_path #{f}"}

  sprockets.import_asset "foundation/js/vendor/modernizr.js"
  sprockets.import_asset "foundation/js/vendor/jquery.js"
  sprockets.import_asset "foundation/js/vendor/jquery.cookie.js"
end

###
# Page options, layouts, aliases and proxies
###

# Per-page layout changes:
#
# With no layout
page "/404.html", :layout => false
page "/playground.html", :layout => false
page "/feed.xml", :layout => false

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
    # [].tap do |names|
    #   names << page_title || ""
    #   names << "Ross Kaffenberger"
    # end.compact.reject(&:blank?).join(" | ")
  end

  def page_title
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
