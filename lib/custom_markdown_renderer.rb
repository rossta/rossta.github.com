require "middleman-core/renderers/redcarpet"

class CustomMarkdownRenderer < Middleman::Renderers::MiddlemanRedcarpetHTML
  def image(link, title, alt_text)
    scope.image_tag(link, title: title, alt: alt_text, loading: "lazy")
  end

  def link(url, title, text)
    anchor_tag(url, text)
  end

  def autolink(url, link_type)
    anchor_tag(url, url)
  end

  def header(title, level)
    @headers ||= []
    permalink = title.gsub(/\W+/, "-").downcase

    if @headers.include? permalink
      permalink += "_1"
      permalink = permalink.succ while @headers.include? permalink
    end
    @headers << permalink

    %(
      <h#{level} id="#{permalink}" class="title title-h#{level}">
        <a name="#{permalink}" class="anchor" href="##{permalink}">#{anchor_svg}</a>
        #{title}
      </h#{level}>
    )
  end

  private

  def anchor_tag(url, text)
    # attributes = {href: url}
    attributes = {}

    unless url.blank? || url.start_with?("/", "#")
      attributes[:target] = "_blank"
      attributes[:rel] = "noopener noreferrer"
    end

    scope.link_to(text, url, attributes)

    # %(<a #{attributes.map { |k, v| "#{k}=\"#{v}\"" }.join(" ")}>#{text}</a>)
  end

  def anchor_svg
    <<-EOS
       <svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewBox="0 0 16 16" width="16">
       <path d="M4 9h1v1h-1c-1.5 0-3-1.69-3-3.5s1.55-3.5 3-3.5h4c1.45 0 3 1.69 3 3.5 0 1.41-0.91 2.72-2 3.25v-1.16c0.58-0.45 1-1.27 1-2.09 0-1.28-1.02-2.5-2-2.5H4c-0.98 0-2 1.22-2 2.5s1 2.5 2 2.5z m9-3h-1v1h1c1 0 2 1.22 2 2.5s-1.02 2.5-2 2.5H9c-0.98 0-2-1.22-2-2.5 0-0.83 0.42-1.64 1-2.09v-1.16c-1.09 0.53-2 1.84-2 3.25 0 1.81 1.55 3.5 3 3.5h4c1.45 0 3-1.69 3-3.5s-1.5-3.5-3-3.5z"></path>
       </svg>
    EOS
  end
end
