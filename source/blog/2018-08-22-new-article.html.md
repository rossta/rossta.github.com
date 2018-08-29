---
title: Stress-free SSL for Rails 5 system tests
author: Ross Kaffenberger
published: false
summary: New Article
description: New Article
pull_image: 'blog/stock/louvre-pexels-photo.jpg'
series:
category: Code
tags:
  - Rails
---

Is your Rails app on SSL in production? It may be a good idea to use SSL locally too. It's just typically been a pain to set up. Using SSL for Rails acceptance tests with Capybara has traditionally been even more challenging— until recently.

In this post I'll demonstrate how I set up my Rails 5 app to run system tests over SSL with wildcard domains.

### Why should I local SSL?

First, a tweet.
<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">I so often get re-explaining from others that &quot;localhost doesn&#39;t need local https&quot;. eyeroll.<br><br>this is not universally true. this tweet thread is the last time i&#39;m gonna explain. henceforth it will just be linked to.</p>&mdash; getify (@getify) <a href="https://twitter.com/getify/status/1023202051902373888?ref_src=twsrc%5Etfw">July 28, 2018</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

As [@getify](https://twitter.com/getify) goes on to describe, there are a variety of benefits to local SSL:

1. To test front-end or back-end URL parsing logic (routing, history, redirects)
1. To catch mixed content warnings
1. To test CORS logic that may cross http or https boundaries
1. To use web platform features that require SSL (or will eventually)
1. To use secure websockets (wss) as the upgrade from https
1. Secure cookies, which behave very differently across http vs https boundaries
1. To test certain https-specific headers like HSTS or CORS allow-*
1. To enable third-party integrations, possibly OAuth-based, that require SSL

### How does it work?

The general workflow I use for setting up my Rails applications for local development over SSL is borrowed from Jed Schmidt's [How to set up stress-free SSL on an OSX development machine](https://gist.github.com/jed/6147872):

1. [Resolve a top-level domain to localhost, using `dnsmasq`](https://gist.github.com/jed/6147872#resolve-a-top-level-domain-for-all-development-work)
1. [Create a wildcard self-signed SSL certificate for each project](https://gist.github.com/jed/6147872#create-a-wildcard-ssl-certificate-for-each-project)
1. [Instruct browsers to trust the certificates](https://gist.github.com/jed/6147872#avoid-https-warnings-by-telling-os-x-to-trust-the-certificate)
1. [Configure a web server (e.g Nginx) or app server (e.g. Puma) to use the certificate](https://gist.github.com/jed/6147872#bask-in-easy-https)

Jed uses a Node.js example to configure a server for SSL; here's a couple of ways to do it for a Rails app:

If you're using the Puma app server for Ruby, you can bind the server to an SSL url on startup by providing paths to the key/certificate pair generated in step 1 above.

```bash
puma -b 'ssl://127.0.0.1:3000?key=path_to_key&cert=path_to_cert'
```
I actually prefer to pass this binding to the Rails server command, which will forward it to Puma:

```bash
rails s -b 'ssl://127.0.0.1:3000?key=path_to_key&cert=path_to_cert'
```
Puma also provides a hook to [set this binding in the config file](https://github.com/puma/puma/blob/395337df4a3b27cc14eeab048016fb1ee85d2f83/examples/config.rb#L79).

Alternatively, if you're using Nginx to proxy local requests, you can [set up your Nginx config with your SSL certificate](http://nginx.org/en/docs/http/configuring_https_servers.html).

<aside class="callout panel">
  <p>
  I should mention an alternative to this workflow is run <a href="https://ngrok.com">ngrok</a> which is a zero-configuration service for running your localhost server over a secure URL. Learn more on setting up ngrok from <a href="https://www.remotesynthesis.com/blog/running-ssl-localhost">this post by Brian Rinaldi</a>.
  </p>
</aside>

---
Capybara
* server configuration
* headless chrome
* headless firefox

DNS trick or lvh.me
---

### Resolve a top-level domain to localhost

Install and configure dnsmasq

brew install dnsmasq
mkdir -pv $(brew --prefix)/etc
sudo cp -v $(brew --prefix dnsmasq)/homebrew.mxcl.dnsmasq.plist /Library/LaunchDaemons
sudo launchctl load -w /Library/LaunchDaemons/homebrew.mxcl.dnsmasq.plist
sudo mkdir -pv /etc/resolver
echo "address=/.$(whoami)/127.0.0.1" | sudo tee -a $(brew --prefix)/etc/dnsmasq.conf
echo "nameserver 127.0.0.1" | sudo tee /etc/resolver/$(whoami)

1. Generate wildcard certficate with the subject alt name extension

```
cat > openssl.cnf <<-EOF
  [req]
  distinguished_name = req_distinguished_name
  x509_extensions = v3_req
  prompt = no
  [req_distinguished_name]
  CN = *.localhost.ssl
  [v3_req]
  keyUsage = keyEncipherment, dataEncipherment
  extendedKeyUsage = serverAuth
  subjectAltName = @alt_names
  [alt_names]
  DNS.1 = *.localhost.ssl
  DNS.2 = localhost.ssl
EOF

openssl req \
  -new \
  -newkey rsa:2048 \
  -sha1 \
  -days 3650 \
  -nodes \
  -x509 \
  -keyout ssl.key \
  -out ssl.crt \
  -config openssl.cnf

rm openssl.cnf
```

1. Trust the certificate through Keychain and/or browser

```
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain private.crt
```

### Notes

### What do I need?

Below is a list of binaries and gems with the versions used in for the demo app. It may be possible to make this work with other relatively recent versions of these tools, though your mileage may vary.

```
$ openssl version
LibreSSL 2.2.7

$ ruby -v
ruby 2.4.1p111 (2017-03-22 revision 58053) [x86_64-darwin16]

$ /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --version
Google Chrome 68.0.3440.106

$ /Applications/Firefox.app/Contents/MacOS/firefox --version
Mozilla Firefox 60.0.1

$ ~/.webdrivers/chromedriver -v
ChromeDriver 2.41.578706 (5f725d1b4f0a4acbf5259df887244095596231db)

$ ~/.webdrivers/geckodriver --version
geckodriver 0.21.0
```
And selected Ruby gems in the `Gemfile`:

```ruby
gem 'rails', '~> 5.2.1'
gem 'puma', '~> 3.12'
gem 'webpacker', '~> 3.5.5' # optional

group :test do
  gem 'capybara', '~> 3.5.1'
  gem 'selenium-webdriver', '~> 3.14.0'
  gem 'webdrivers', '~> 3.3.3'
  gem 'rspec-rails', '~> 3.8.0' # optional
end
```
Other versions of these tools may work fine. For example, Puma server configuration was added to Capybara as of `3.1.0` and `chromedriver` added support for the `acceptInsecureCerts` flag in 2.35/Chrome 65. Just be aware that possible issues may arise otherwise, as [I found out](https://stackoverflow.com/questions/51881206/using-acceptinsecurecerts-with-headless-chrome-and-selenium-webdriver-macos-ra) by inadvertently using an older version of `chromedriver`.

I recommend the `webdrivers` gem as it will install the lastest driver binaries as needed on your behalf, including `chromedriver` for Chrome and `geckodriver` for Firefox. Many other posts may instruct you to install `chromedriver` with Homebrew or point to the `chromedriver-helper` gem; these may work just fine for you, though it will be up to you to keep the drivers updated.

### Wrapping up

SSL everywhere, most of us don't think "everywhere" includes localhost.
