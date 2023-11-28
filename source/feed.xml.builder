xml.instruct!
xml.feed "xmlns" => "http://www.w3.org/2005/Atom" do
  xml.title "rossta.net"
  xml.subtitle "Ross Kaffenberger"
  xml.id "https://rossta.net/"
  xml.link "href" => "https://rossta.net/"
  xml.link "href" => "https://rossta.net/feed.xml", "rel" => "self"
  xml.updated (blog("blog").articles.first&.date || Date.today).to_time.iso8601 ||
    xml.author { xml.name "Ross Kaffenberger" }

  blog("blog").articles[0..5].each do |article|
    xml.entry do
      xml.title article.title
      xml.link "rel" => "alternate", "href" => article.url
      xml.id article.url
      xml.published article.date.to_time.iso8601
      xml.updated article.date.to_time.iso8601
      xml.author { xml.name "Ross Kaffenberger" }
      xml.summary article.summary, "type" => "html"
      xml.content article.body, "type" => "html"
    end
  end
end
