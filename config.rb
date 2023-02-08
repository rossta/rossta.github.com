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
    names.map { |name| %(<link rel="stylesheet" href="#{webpack_manifest[name + ".css"]}" media="all"></link>) }.join("")
  end

  def javascript_pack_tag(*names)
    names.map { |name| "<script src='#{webpack_manifest[name + ".js"]}'></script>" }.join("")
  end

  def to_url(opts = {})
    Addressable::URI.new({
      scheme: config[:protocol],
      host: config[:host],
      port: build? ? nil : config[:port]
    }.merge(opts))
  end

  def current_url
    path = current_page.path
    path = "/" if homepage?
    path = current_article.url if current_article
    to_url(path: path)
  end

  def homepage?
    current_page.path == "index.html"
  end

  def image_url(source)
    to_url(path: image_path(source))
  end

  def lazy_image_tag(src, opts = {})
    image_tag(src, {loading: "lazy"}.merge(opts))
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

  def discuss_article_on_twitter_link_to(article, options = {})
    opts = options.except(:prompt)
    prompt = opts.fetch(:prompt, "Discuss it on Twitter")
    tweet_link_to prompt, {
      text: [article.title, "rossta.net"].join(" - "),
      url: to_url(path: article.url)
    }, options
  end

  def top_tags
    blog("blog").tags.sort_by { |_t, a| -a.count }.to_h
  end

  def top_curated_tags
    top_tags.keys & %w[Webpack Rails Ruby JavaScript Vue]
  end

  def top_articles
    blog("blog").articles.select { |a| a.data[:popular] }.sort_by { |a| a.data[:popular] }
  end

  def webpack_on_rails_articles
    @webpack_on_rails_articles ||= begin
      tags = %w[Webpack Rails]
      blog("blog").articles.select { |a| (tags & a.tags) == tags }
    end
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

  def blog_series
    data.series.map { |attrs| Struct.new(:id, :title, :summary).new(*attrs) }
  end

  def current_page_tags
    explicit_page_tags.presence || %w[JavaScript Ruby]
  end

  def explicit_page_tags
    Array(current_page.data[:tags])
  end

  def convertkit_tag_value(tag)
    data.convertkit_tags[tag]
  end

  def current_page_tagged?(tagged_with = [])
    ((current_page.data.tags || []) & tagged_with).any?
  end

  def convertkit_inline_form_id
    convertkit_webpack_landing_page_form_id = "1672590"
    convertkit_webpack_inline_form_id = "1268949"
    convertkit_standard_inline_form_id = "818387"
    if /webpack-on-rails\/index/.match?(current_page.path)
      convertkit_webpack_landing_page_form_id
    elsif current_page_tagged?(%w[Rails Webpack])
      convertkit_webpack_inline_form_id
    else
      convertkit_standard_inline_form_id
    end
  end

  def convertkit_campaign
    explicit_page_tags.first || "Homepage"
  end

  def current_article_ld_json
    {
      "@context": "https://schema.org",
      "@type": "Article",
      publisher: {
        "@type": "Organization",
        name: "Ross Kaffenberger"
      },
      author: {
        "@type": "Person",
        name: "Ross Kaffenberger",
        image: {
          "@type": "ImageObject",
          url: "https://rossta.net/assets/images/me.jpg",
          width: 400,
          height: 400
        },
        url: "https://rossta.net",
        sameAs: [
          "https://rossta.net/about/",
          "https://twitter.com/rossta"
        ]
      },
      headline: current_article.title,
      url: current_url,
      datePublished: current_article.date.iso8601,
      keywords: (current_page.data.tags || []).join(", ").downcase,
      description: current_page.data.description,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://rossta.net"
      }
    }
  end
end
