# frozen_string_literal: true

require "json"
require_relative("./lib/custom_markdown_renderer")

activate(:livereload)
activate(:meta_tags)

# activate :directory_indexes
# Time.zone = "UTC"
activate(:external_pipeline, name: :webpack, command: build? ? "yarn build:prod" : "yarn build:dev", source: ".tmp/dist", latency: 1)

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
# rubocop:disable
helpers do
  def page_title
    yield_content(:title)
  end

  def page_header(title, summary = nil)
    partial("partials/page_header", locals: {title: title, summary: summary})
  end

  def section
    (yield_content(:section) || title || "")
  end

  def webpack_manifest
    manifest_path = ".tmp/dist/manifest.json"

    unless File.exist?(manifest_path)
      warn("Could not read manifest json!!")
      return {}
    end

    @webpack_manifest ||= JSON.parse(File.read(manifest_path))
  end

  def stylesheet_pack_tag(*names)
    names.map { |name| "<link href='#{webpack_manifest[name + ".css"]}' rel='stylesheet' media='all'></link>" }.join("")
  end

  def javascript_pack_tag(*names)
    names.map { |name| "<script src='#{webpack_manifest[name + ".js"]}'></script>" }.join("")
  end

  def to_url(opts = {})
    Addressable::URI.new({
      scheme: config[:protocol],
      host: config[:host],
      port: build? ? nil : config[:port],
    }.merge(opts))
  end

  def current_url
    path = current_page.path
    path = "/" if homepage?
    to_url(path: path)
  end

  def homepage?
    current_page.path == "index.html"
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
      query_values: {u: "8ce159842b5c98cecb4ebdf16", id: config[:mailchimp_form_id]}
    )
  end

  def tweet_link_to(text, params = {}, options = {})
    uri = Addressable::URI.parse("https://twitter.com/intent/tweet")
    uri.query_values = params
    link_to(text, uri, options.merge(target: "_blank", rel: "noopener noreferrer"))
  end

  def discuss_on_twitter_link_to(url, options = {})
    uri = Addressable::URI.parse("https://mobile.twitter.com/search")
    uri.query_values = {q: url}
    link_to("Discuss on Twitter", uri, options.merge(target: "_blank", rel: "noopener noreferrer"))
  end

  def top_tags
    blog("blog").tags.sort_by { |_t, a| -a.count }.to_h
  end

  def top_curated_tags
    top_tags.keys & %w[Rails Vue Ruby Webpack JavaScript]
  end

  def top_articles
    blog("blog").articles.select { |a| a.data[:popular] }.sort_by { |a| a.data[:popular] }
  end

  # Look for similar articles published since and prior to current
  # Fall back to different articles
  def related_articles(article, count = 3)
    other_articles = blog("blog").articles - [article]
    article_tags = article.tags
    similar, different = *other_articles.partition { |a| (a.tags & article_tags).any? }
    similar_since, similar_prior = similar.partition { |a| a.date > article.date }
    similar_ordered = (similar_since + similar_prior)

    if similar_since.length > (count - 1)
      similar_ordered = (similar_since + similar_prior).rotate(similar_since.length - (count - 1))
    end

    (similar_ordered + different).take(count)
  end

  Series = Struct.new(:id, :title, :summary)

  def blog_series
    [
      [
        "PDF Viewer",
        "Building a PDF Viewer with Vue.js",
        "A demo app to render PDFs using PDF.js, Vue, Webpack, and the canvas element",
      ],
      [
        "Connect Four",
        "Building Connect Four with Vue.js and Phoenix",
        "Tackling multi-player game rendering, animation, and realtime interaction",
      ],
      [
        "Service Worker",
        "Progressive Web Apps on Rails",
        "Leveraging the powerful JavaScript API for Progressive Web Apps",
      ],
      [
        "Enumerable",
        "Exploring Ruby's Enumerable",
        "Working with collections and sequences in Ruby",
      ],
    ].map { |data| Series.new(*data) }
  end

  def current_page_tags
    explicit_page_tags.presence || %w[JavaScript Ruby]
  end

  def explicit_page_tags
    Array(current_page.data[:tags])
  end

  def convertkit_tag_value(tag)
    {
      "JavaScript" => "733959",
      "Vue" => "733963",
      "Ruby" => "733960",
      "Rails" => "733966",
      "Webpack" => "733964",
      "Service Worker" => "733965",
      "Node" => "733969",
      "Elixir" => "733970",
    }[tag]
  end

  def current_page_tagged?(tagged_with = [])
    ((current_page.data.tags || []) & tagged_with).any?
  end

  def convertkit_campaign
    explicit_page_tags.first || "Homepage"
  end

  def nozen?
    @nozen
  end

  def nozen!
    @nozen = true
  end
end
