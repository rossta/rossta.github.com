namespace :article do
  task :new do
    title = ENV['TITLE'] || "New Article"
    slug  = title.downcase.gsub(/\s/, "-")
    file_name = File.join("source", "blog", Time.now.strftime("%Y-%m-%d-#{slug}.md"))
    touch file_name
    File.open(file_name, "w+") do |f|
      f.write <<-META
---
title: #{title}
author: Ross Kaffenberger
published: false
summary: #{title}
description: #{title}
pull_image: 'https://rossta.net/assets/images/blog/stock/fall-leaves-pexels-photo.jpg'
tags:
  - Code
---
META
    end
  end
end

desc "Generate new article"
task :article => ['article:new']
