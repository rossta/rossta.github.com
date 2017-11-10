require "fileutils"
require "rubygems"
require "pry"

PROJECT_ROOT = `git rev-parse --show-toplevel`.strip
ORIGIN_URL = `git config --get remote.origin.url`.strip

def account
  "rossta"
end

def branch
  "master"
end

def origin_url
  ORIGIN_URL
end

def git_initialize
  # local git initialized?
  return if File.exist?(".git")
  system "git init"
  system "git remote add origin #{origin_url}"
  system "git fetch origin"
  system "git checkout --orphan #{branch}"

  # remote gh-pages branch exists?
  return if `git branch -r`.strip.split(/\s+/).include?("origin/#{branch}")
  system "touch index.html"
  system "git add ."
  system "git commit -m 'initial #{branch} commit'"
  system "git push origin #{branch}"
end

def git_update
  system "git fetch origin"
  system "git reset --hard origin/#{branch}"

  # Remove all files so we don't accidentally keep old stuff
  # These will be regenerated by the build process
  system "rm `git ls-files`"
end

def build
  system "NODE_ENV=production bundle exec middleman build"
end

desc "Deploy the website to github pages"
task :publish do |t, args|
  head = `git log --pretty="%h" -n1`.strip
  message = "Site updated to #{head}"

  mkdir_p ".tmp"
  mkdir_p "dist"
  Dir.chdir "dist" do
    git_initialize
    git_update
  end

  Dir.chdir PROJECT_ROOT do
    unless build
      puts "The build failed, stopping deploy. Please fix build errors before re-deploying."
      exit 1
    end

    cp_r "build/.", "dist"
    rm_r "build"
  end

  Dir.chdir "dist" do
    system "git add -A"
    system "git commit -m '#{message.gsub("'", "\\'")}'"
    system "git push origin #{branch}"
  end
end

task :deploy => :publish
