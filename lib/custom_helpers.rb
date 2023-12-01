module CustomHelpers
  class WebpackManifest
    def entrypoints(name, type)
      raise "Unknown webpack entrypoint type: #{type.inspect}" unless type.in?(%w[js css])

      data.dig("entrypoints", name, "assets", type)
    end

    private

    def data
      @data ||= load
    end

    def load
      unless File.exist?(manifest_path)
        warn("Could not read manifest json!!")
        return {}
      end

      JSON.parse(File.read(manifest_path))
    end

    def manifest_path
      ".tmp/dist/manifest.json"
    end
  end

  def page_title
    yield_content(:title)
  end

  def page_header(title, summary = nil)
    partial("partials/page_header", locals: {title:, summary:})
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

  def manifest
    @manifest ||= WebpackManifest.new
  end

  def stylesheet_pack_tag(name)
    manifest.entrypoints(name, "css").map do |url|
      %(<link rel="stylesheet" href="#{url}" media="all"></link>)
    end.join
  end

  def javascript_pack_tag(name)
    manifest.entrypoints(name, "js").map do |url|
      %(<script src="#{url}"></script>)
    end.join
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
    to_url(path:)
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
    top_tags.keys & %w[Rails Ruby JavaScript]
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

  def blog_series
    data.series.map { |attrs| Struct.new(:id, :title, :summary).new(*attrs) }
  end

  def current_page_tags
    explicit_page_tags.presence || %w[Rails]
  end

  def explicit_page_tags
    Array(current_page.data[:tags])
  end

  def current_convertkit_tag_values
    current_page_tags.map { |tag| convertkit_tag_value(tag) }.compact
  end

  def convertkit_tag_value(tag)
    data.convertkit_tags[tag]
  end

  def current_page_tagged?(tagged_with = [])
    ((current_page.data.tags || []) & tagged_with).any?
  end

  CONVERTKIT_STANDARD_INLINE_FORM_ID = "818387"
  def convertkit_inline_form_id
    CONVERTKIT_STANDARD_INLINE_FORM_ID
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
