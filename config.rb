# require "bundler"
# Bundler.require
# require "less"
# require "csv"
# require "markaby"
# require "liquid"
# require "radius"
# require "redcloth"
# require "rdoc"
# require "rdoc/markup"
# require "rdoc/markup/to_html"
# require "wikicloth"
# require "creole"
# require "wikicloth"
# require "yajl"
# require "asciidoctor"
require "uglifier"

activate :livereload
activate :directory_indexes
activate :autoprefixer
# activate :meta_tags

# Time.zone = "UTC"
activate :external_pipeline,
         name: :webpack,
         command: build? ? "./node_modules/webpack/bin/webpack.js --bail" : "./node_modules/webpack/bin/webpack.js --watch -d --progress --color",
         source: ".tmp/dist",
         latency: 1

###########################
## Blog
###########################
activate :blog do |blog|
  blog.name = "blog"
  blog.prefix = "blog"
  blog.permalink = "/:title.html"
  blog.sources = ":year-:month-:day-:title.html"
  blog.layout = "post"
  blog.tag_template = "tag.html"
  blog.calendar_template = "calendar.html"
  blog.paginate = true
  blog.per_page = 25
  blog.default_extension = ".md"
  blog.custom_collections = {
    series: {
      link: '/series/{series}.html',
      template: '/series.html'
    }
  }
end

###########################
## Talks
###########################
activate :blog do |blog|
  blog.name = "talks"
  blog.prefix = "talks"
  blog.permalink = "/:title.html"
  blog.taglink = "tags/{tag}"
  blog.sources = ":year-:month-:day-:title.html"
  blog.default_extension = ".md"
  blog.layout   = "talk"
  blog.paginate = true
  blog.per_page = 25
end

###########################
## Projects
###########################
activate :blog do |blog|
  blog.name = "projects"
  blog.prefix = "projects"
  blog.permalink = "/:title.html"
  blog.taglink = "tags/{tag}"
  blog.sources = ":year-:month-:day-:title.html"
  blog.default_extension = ".md"
  blog.layout   = "project"
  blog.paginate = true
  blog.per_page = 25
end

set :markdown_engine, :redcarpet
set :markdown,
  layout_engine: :erb,
  no_intra_emphasis: true,
  fenced_code_blocks: true,
  autolink: true,
  disable_indented_code_blocks: true,
  smartypants: true,
  lax_spacing: true

set :css_dir, 'assets/stylesheets'
set :js_dir, 'assets/javascripts'
set :images_dir, 'assets/images'

# Build-specific configuration
configure :build do
  activate :minify_css
  activate :minify_javascript
  activate :asset_hash, ignore: [/^assets\/images\//]
  activate :cache_buster
  activate :gzip, exts: %w(.js .css .html .htm .svg .ttf .otf .woff .eot)

  # Use relative URLs
  # activate :relative_assets

  # activate :directory_indexes

  # Compress PNGs after build
  # First: gem install middleman-smusher
  # require "middleman-smusher"
  # activate :smusher

  # Or use a different image path
  # set :http_path, "/Content/images/"

  set :trailing_slash, false

  set :google_analytics_id, 'UA-16458563-2'
  set :mailchimp_form_id,   '96030b0bda'
  set :segmentio_id, 'NdBtrprkAGAjQryMShljRdVf90saElAU'
end

configure :development do
  set :google_analytics_id, 'UA-xxxxxxxx-x'
  set :mailchimp_form_id,   'a57e354058'
  set :segmentio_id, '7KlQZWWPWr2MDj4pWepIF7O95JPZ9wfp'
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

# compass_config do |config|
#   # Require any additional compass plugins here.
#   config.add_import_path "../bower_components/foundation/scss"
#
#   # Set this to the root of your project when deployed:
#   config.http_path = "/"
#   config.css_dir = "stylesheets"
#   config.sass_dir = "stylesheets"
#   config.images_dir = "images"
#   config.javascripts_dir = "javascripts"
# end

# after_configuration do
#   @bower_config = JSON.parse(IO.read("#{root}/.bowerrc"))
#   sprockets.append_path File.join(root, @bower_config["directory"])
#
#   sprockets.import_asset "foundation/js/vendor/modernizr.js"
#   sprockets.import_asset "foundation/js/vendor/jquery.js"
#   sprockets.import_asset "foundation/js/vendor/jquery.cookie.js"
# end

###
# Page options, layouts, aliases and proxies
###

# Per-page layout changes:
#
# With no layout
page "/404.html", layout: false
page "/playground.html", layout: false
page "/feed.xml", layout: false
page "/sitemap.xml", layout: false

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
    "Ross Kaffenberger"
  end

  def page_title
    yield_content(:title)
  end

  def page_header(title, summary = nil)
    partial 'layouts/page_header', locals: { title: title, summary: summary }
  end

  def section
    (yield_content(:section) || title || "")
  end

  def url_with_host(path)
    "https://rossta.net" + path
  end

  def email_url
    "mailto:ross@rossta.net"
  end

  def signup_form_url
    "//rossta.us6.list-manage.com/subscribe/post?u=8ce159842b5c98cecb4ebdf16&amp;id=#{config[:mailchimp_form_id]}"
  end

  def tweet_link_to(text, params = {})
    uri = Addressable::URI.parse("https://twitter.com/intent/tweet")
    uri.query_values = params
    link_to text, uri, target: "_blank"
  end

  def nozen?
    @nozen
  end

  def nozen!
    @nozen = true
  end
end
