---
title: Local SSL for Rails 5 development and system tests
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
1. To test certain https-specific headers like HSTS or CORS `allow-*`
1. To enable third-party integrations, possibly OAuth-based, that require SSL

### How does it work?

The general workflow I use for setting up my Rails applications for local development and tests over SSL is as follows:

1. Resolve a domain to localhost
1. Create a self-signed SSL certificate
1. Instruct browsers to trust the certificate
1. Configure the server to use the cerficate

For another resource on this workflow that is updated regularly, checkout Jed Schmidt's [How to set up stress-free SSL on an OSX development machine](https://gist.github.com/jed/6147872)

An alternative to this workflow is to use [ngrok](https://ngrok.com), a zero-configuration service for running your localhost server over a secure URL. While this approach may work well for local development, I don't know of anyone using it for test or CI environments. Learn more on setting up ngrok from [this post by Brian Rinaldi](https://www.remotesynthesis.com/blog/running-ssl-localhost).

### Resolve a domain name to localhost
To use SSL locally, you may want to use something besides `localhost`, otherwise you could skip this section.

Here are three alternatives for using a standard domain name for local development and tests.
#### Manual configuration
The simplest approach is to add an entry for each domain you want to use to your `/etc/hosts` file.

```
# /etc/hosts

127.0.0.1     localhost.ross
```

#### Dynamic local domains
If you prefer a more flexible approach, need to resolve arbitrary subdomains, or have many local projects, you may want to use `dnsmasq`.

The following script (borrowed from Jed) will install and configure dnsmasq. The dnsmasw server will resolve all requests to the top level domain `.ross` on my local machine back to `127.0.0.1`. (Replace `$(whoami)` with your preferred top-level domain).
```
local_tld=$(whoami)
brew install dnsmasq
mkdir -pv $(brew --prefix)/etc
sudo cp -v $(brew --prefix dnsmasq)/homebrew.mxcl.dnsmasq.plist /Library/LaunchDaemons
sudo launchctl load -w /Library/LaunchDaemons/homebrew.mxcl.dnsmasq.plist
sudo mkdir -pv /etc/resolver
echo "address=/.$local_tld/127.0.0.1" | sudo tee -a $(brew --prefix)/etc/dnsmasq.conf
echo "nameserver 127.0.0.1" | sudo tee /etc/resolver/$local_tld
```

#### Use a registered domain name
An alternative to dnsmasq is to use an registered domain name with A records to resolve the appex and wildcard subdomains to `127.0.0.1`. You can purchase your own or rely on a known localhost domain name like `lvh.me` or `xip.io`.

### Create a self-signed certificate

The following script (adapted from Jed) will generate a self-signed certificate and private key for `localhost.ross` on my machine.
```bash
name=localhost.$(whoami)
openssl req \
  -new \
  -newkey rsa:2048 \
  -sha256 \
  -days 3650 \
  -nodes \
  -x509 \
  -keyout $name.key \
  -out $name.crt \
  -config <(cat <<-EOF
  [req]
  distinguished_name = req_distinguished_name
  x509_extensions = v3_req
  prompt = no
  [req_distinguished_name]
  CN = $name
  [v3_req]
  keyUsage = keyEncipherment, dataEncipherment
  extendedKeyUsage = serverAuth
  subjectAltName = @alt_names
  [alt_names]
  DNS.1 = $name
  DNS.2 = *.$name
EOF
)
```
A key/certificate files are named `localhost.ross.key` and `localhost.ross.crt`. We'll need both to configure the server.

For Rails projects, I typically generate separate key/pairs using different domain names for each project. You can do this by changing the value of `name=localhost.ross` to your own desired domain name. You can omit the line `DNS.2 = *.$name` if you don't need wildcard subdomains.

### Trust the certificate

On macOS, we can trust the certificate in the System Keychain with this one-liner.
```
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain config/ssl/localhost.ross.crt
```
There are a variety of blog posts out there that demonstrate how to do this manually through the Keychain application; that should work too.

### Server setup

If you're using Nginx to proxy local requests, you can [set up your Nginx config with your SSL certificate](http://nginx.org/en/docs/http/configuring_https_servers.html). I often use Nginx for development but almost never for running tests, so I'll instead demonstrate how to configure Puma to terminate SSL, which will work for both environments.

First, I'll typically move my self-signed certificates into the Rails project directory.
```sh
cd path/to/my/rails/app
mkdir config/ssl
mv path/to/localhost.ross.{key,crt} config.ssl
```
With puma, we can bind the server to an SSL url on startup by providing paths to the key/certificate pair generated in the previous step.

Now, when starting the rails server from the root of the project for local development, I'll specify the ssl binding as follows:
```bash
rails s -b 'ssl://127.0.0.1:3000?key=config/ssl/localhost.ross.key&cert=config/ssl/localhost.ross.crt'
```
Since I use `foreman` to run my application locally, I'll place this command in the `Procfile.dev` file. You can modify the port to your choosing or reference the $PORT variable.

The `-b` option is forwarded to the underlying puma server, so the command could alternatively work as:
```bash
puma -b 'ssl://127.0.0.1:3000?key=config/ssl/localhost.ross.key&cert=config/ssl/localhost.ross.crt'
```
Puma also provides a hook to [set this binding in the config file](https://github.com/puma/puma/blob/395337df4a3b27cc14eeab048016fb1ee85d2f83/examples/config.rb#L79).

With

### Configuring the test environment

### Upgrading from prior versions

Upgrading an existing app
* https://stackoverflow.com/questions/49246124/is-databasecleaner-still-necessafry-with-rails-system-specs

---

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
