require_relative "./lib/custom_markdown_renderer"

activate :livereload
activate :meta_tags
# activate :directory_indexes

ENV['WEBPACK_ENV'] ||= (build? ? 'build' : 'development')

# Time.zone = "UTC"
activate :external_pipeline,
         name: :webpack,
         command: build? ?
         "WEBPACK_ENV=#{ENV.fetch('WEBPACK_ENV')} ./node_modules/webpack/bin/webpack.js --bail -p" :
         "WEBPACK_ENV=#{ENV.fetch('WEBPACK_ENV')} ./node_modules/webpack/bin/webpack.js --watch -d --progress --color",
         source: ".tmp/dist",
         latency: 1

###########################
## Blog
###########################
activate :blog do |blog|
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
  blog.custom_collections = {
    series: {
      link: '/series/{series}.html',
      template: 'series.html'
    }
  }
end

###########################
## Talks
###########################
activate :blog do |blog|
  blog.name = "talks"
  blog.prefix = "talks"
  blog.permalink = "/{title}.html"
  blog.taglink = "tags/{tag}"
  blog.sources = "{year}-{month}-{day}-{title}.html"
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
  blog.permalink = "/{title}.html"
  blog.taglink = "tags/{tag}"
  blog.sources = "{year}-{month}-{day}-{title}.html"
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
  lax_spacing: true,
  renderer: CustomMarkdownRenderer

set :css_dir, 'assets/stylesheets'
set :js_dir, 'assets/javascripts'
set :images_dir, 'assets/images'

# Build-specific configuration
configure :build do
  set :trailing_slash, false

  set :protocol, "https"
  set :host, "rossta.net"
  set :google_analytics_id, 'UA-16458563-2'
  set :mailchimp_form_id,   '96030b0bda'
  set :segmentio_id, 'NdBtrprkAGAjQryMShljRdVf90saElAU'

  activate :asset_hash, ignore: [/^serviceworker.js/, /touch-icon.*png/]
  activate :gzip, exts: %w(.js .css .html .htm .svg .ttf .otf .woff .eot)
end

configure :development do
  set :protocol, "http"
  set :host, "localhost"
  set :port, 4567

  set :google_analytics_id, 'UA-xxxxxxxx-x'
  set :mailchimp_form_id,   'a57e354058'
  set :segmentio_id, '7KlQZWWPWr2MDj4pWepIF7O95JPZ9wfp'
end

###
# Page options, layouts, aliases and proxies
###

# Per-page layout changes:
#
# With no layout
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
  def page_title
    yield_content(:title)
  end

  def page_header(title, summary = nil)
    partial "partials/page_header", locals: { title: title, summary: summary }
  end

  def section
    (yield_content(:section) || title || "")
  end

  def to_url(opts = {})
    Addressable::URI.new({
      scheme: config[:protocol],
      host: config[:host],
      port: build? ? config[:port] : nil,
    }.merge(opts))
  end

  def current_url
    path = current_page.path
    path = "/" if current_page.path == "index.html"
    to_url(path: path)
  end

  def image_url(source)
    to_url(path: image_path(source))
  end

  def email_url
    "mailto:ross@rossta.net"
  end

  def signup_form_url
    Addressable::URI.new(
      scheme: nil,
      host: "rossta.us6.list-manage.com",
      path: "/subscribe/post",
      query_values: {
        u: "8ce159842b5c98cecb4ebdf16",
        id: config[:mailchimp_form_id]
      }
    )
  end

  def tweet_link_to(text, params = {})
    uri = Addressable::URI.parse("https://twitter.com/intent/tweet")
    uri.query_values = params
    link_to text, uri, target: "_blank", rel: "noopener"
  end

  def top_tags
    blog('blog').tags.sort_by { |t, a| -a.count }
  end

  def top_articles
    blog('blog').articles.select { |a| a.data[:popular] }.sort_by { |a| a.data[:popular] }
  end

  Series = Struct.new(:id, :title, :summary)
  def blog_series
    [
      ["Service Worker", "Progressive Web Apps on Rails", "Leveraging the powerful JavaScript API for Progressive Web Apps"],
      ["Enumerable", "Exploring Ruby's Enumerable", "Working with collections and sequences in Ruby"]
    ].map { |data| Series.new(*data) }
  end

  def current_page_tags
    Array(current_page.data[:tags])
  end

  def nozen?
    @nozen
  end

  def nozen!
    @nozen = true
  end
end
