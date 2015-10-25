require "csv"
CSV.open('doc/rossta-2015-08-18-rewritten-links.csv', 'wb') do |target|
  CSV.foreach('doc/rosskaff-2015-08-18T09-33-01.279869-links.csv').each do |source|
    source_url = source[0]
    target_url = source_url.gsub(%r{http://rosskaff.com/blog/\d+/\d+/(.*)}, 'https://rossta.net/blog/\1')
    target << [source_url, target_url]
  end
end
