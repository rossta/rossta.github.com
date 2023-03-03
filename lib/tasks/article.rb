namespace :article do
  task :new do
    title = ENV["TITLE"] || "New Article"
    slug = title.downcase.gsub(/\s/, "-")
    file_name = File.join("source", "blog", Time.now.strftime("%Y-%m-%d-#{slug}.html.md"))
    touch file_name
    File.write(file_name, <<~META)
      ---
      title: #{title}
      author: Ross Kaffenberger
      published: false
      summary: #{title}
      description: #{title}
      thumbnail: 'blog/stock/louvre-pexels-photo.jpg'
      thumbnail_caption: Photo by Yoyo Ma on Unsplash
      series:
      category: Code
      tags:
        - Rails
      ---
    META
  end
end

desc "Generate new article"
task article: ["article:new"]
