---
title: Local SSL for Rails 5 development and tests
author: Ross Kaffenberger
published: true
summary: Self-signed certificates, wildcard domains, Pumas, and Capybaras—oh my!
description: Is your Rails app on SSL in production? It may be a good idea to use SSL locally too. It's just that it's typically been a pain to set up. Using SSL for Rails acceptance tests with Capybara has traditionally been even more challenging— until now.
pull_image: 'blog/stock/james-sutton-padlock-unsplash.jpg'
pull_image_caption: Photo by James Sutton on Unsplash
popular: 2
series:
category: Code
tags:
  - Rails
---

Is your Rails app on SSL in production? It may be a good idea to use SSL locally too. It's just that it's typically been a pain to set up for development. Using SSL with Capybara for acceptance tests has traditionally been even more challenging— until now.

In this post I'll demonstrate how I set up my Rails 5 app for local development and system tests over SSL with wildcard domains.

[![Local Rails SSL Demo](screenshots/screenshot-local-ssl-demo.png)](https://github.com/rossta/local-ssl-demo-rails)
### Why local SSL?

First, a tweet.
<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">I so often get re-explaining from others that &quot;localhost doesn&#39;t need local https&quot;. eyeroll.<br><br>this is not universally true. this tweet thread is the last time i&#39;m gonna explain. henceforth it will just be linked to.</p>&mdash; getify (@getify) <a href="https://twitter.com/getify/status/1023202051902373888?ref_src=twsrc%5Etfw">July 28, 2018</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script><p></p>

To summarize Kyle Simpson's Twitter rant, if your production app is on SSL, you want to develop on local SSL as well to test:

1. URL logic (routing, history, redirects, enforcing https)
1. No mixed content warnings
1. CORS across http or https boundaries
1. Web platform features (e.g., geolocation) that require SSL (or will eventually)
1. Secure websockets (wss) as the upgrade from https
1. Secure cookies, which behave very differently across http vs https boundaries
1. Https-specific headers like HSTS or CORS `allow-*`
1. Third-party integrations, possibly OAuth-based, that require SSL

One knock against local SSL is that it has been considered a pain to set up. This post and the companion gitub repo, [rossta/local-ssl-demo-rails](https://github.com/rossta/local-ssl-demo-rails), is intended to help make that task a little easier for Rails apps.

### How does it work?

The general workflow I use for setting up my Rails applications for local SSL is as follows:

1. [Resolve a domain to localhost](#resolve-a-domain-name-to-localhost)
1. [Create a self-signed SSL certificate](#create-a-self-signed-certificate)
1. [Instruct browsers to trust the certificate](#trust-the-certificate)
1. [Configure the local server to use the cerficate](#configure-the-local-server)

There are plenty of reasonable alternatives to this workflow.

Jed Schmidt's excellent [How to set up stress-free SSL on an OSX development machine](https://gist.github.com/jed/6147872) is also worth checking out; it walks through a similar setup for a Node.js server.

You could, instead of trusting certificates for each app you develop, create your own [SSL certificate authority](https://deliciousbrains.com/ssl-certificate-authority-for-local-https-development/). The setup steps are more invovled, but once your local CA is trusted by browsers, you can skip the process of manually trusting each cert.

Or, use [ngrok](https://ngrok.com), a zero-configuration service for running your localhost server over a secure URL. While this approach may work well for local development, I currently don't know of anyone using it for tests or CI environments. Learn more on setting up ngrok from [this post by Brian Rinaldi](https://www.remotesynthesis.com/blog/running-ssl-localhost).

### Resolve a domain name to localhost
To use SSL locally for a custom domain, i.e., something besides `localhost`, you'll need to find a way to route requests for that domain back to your local IP; for this post we'll assume the IP is `127.0.0.1`. It may be something else if you're developing on a separate VM such as through Vagrant.

Here are a few alternatives for using a custom domain name for local development and tests.

#### Manual configuration
The simplest approach is to add an entry for each domain you want to use to your `/etc/hosts` file.

```
# /etc/hosts

127.0.0.1     localhost.ross
```
The disadvantage is that `/etc/hosts` does not support wildcard domains, so you would need to add an entry for every unique domain you plan to use.

#### Dynamic local domains
For more flexible approach, you may want to use `dnsmasq` to route arbitrary domain names wherever you want. In our case, we can use it to send all traffic on a custom tld back to our local machine.

The following script (adapted from Jed) will install and configure dnsmasq. The dnsmasq server will resolve all requests to the top level domain `.ross` on my local machine back to `127.0.0.1`. (Replace `$(whoami)` with your preferred top-level domain):
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
Or, purchase a domain and add A records to resolve the appex and wildcard subdomains to `127.0.0.1`. This is the approach used by known "localhost" domains like `lvh.me` or `xip.io`.

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
The key/certificate files generated on my machine would be named `localhost.ross.key` and `localhost.ross.crt`.

To generate a tld for a different domain, change `localhost.$(whoami)` to your own desired domain name. You can omit the line `DNS.2 = *.$name` if you don't need wildcard subdomains or if you're simply setting up SSL for `localhost`.

For Rails projects, I typically generate separate key/pairs using different domain names for each project and move  each file pair to my Rails `config` directory:

```bash
mkdir -p config/ssl
mv localhost.ross.key localhost.ross.crt config/ssl
```

### Trust the certificate
On macOS, we can trust the certificate in the System Keychain with this one-liner.
```
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain config/ssl/localhost.ross.crt
```
There are a variety of blog posts out there that demonstrate how to do this manually through the Keychain application; that should work too.

### Configure the local server
Now that we have a trusted certificate, we can configure Puma with our key/certificate pair to serve local SSL requests for both `development` and `test` on our custom domain. (You could also use Nginx to proxy local requests and [set up your Nginx config with your SSL certificate](http://nginx.org/en/docs/http/configuring_https_servers.html)).

#### In development
First, I'll typically move my self-signed key and certificate into the Rails project directory.
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
Since I use `foreman` to run my application locally, I'll place the command in the `Procfile.dev` file and substitute the port number with the `$PORT` variable:
```bash
rails s -b 'ssl://127.0.0.1:$PORT?key=config/ssl/localhost.ross.key&cert=config/ssl/localhost.ross.crt'
```
Puma also provides a hook to [set this binding in the config file](https://github.com/puma/puma/blob/395337df4a3b27cc14eeab048016fb1ee85d2f83/examples/config.rb#L79).

If you're using Webpack with the `webpacker` gem to bundle javascript and other static assets, you will want to connect to the `webpack-dev-server` in development over SSL. This can be done in the `config/webpacker.yml` file:

```yml
# config/webpacker.yml
development:
  <<: *default
  # ...
  dev_server:
    https: true
```
In recent versions of `webpacker-dev-server`, the SSL certificate is generated on your behalf; you may have to trust this certificate manually in Keychain separately to avoid invalid certificate errors in the browser.

#### In tests
Using our SSL certificates for local Rails testing is mostly relevant for system tests (aka acceptance or feature tests) where we would typically use Capybara to launch a real app server. Setting up Capybara to handle SSL requests has been painful, possibly involving some [server monkeypatching](https://gist.github.com/Papierkorb/1787d28874443ec760d1) to wire everything up.

As of Capybara `>= 3.1.0`, it's much easier to pass configuration to the underlying Puma server to include our SSL certificates ([commit](https://github.com/teamcapybara/capybara/pull/2028)) using a binding similar to our startup command in development:

```ruby
Capybara.server = :puma, server: {
  Host: "ssl://#{Capybara.server_host}?key=config/ssl/localhost.ross.key&cert=config/ssl/localhost.ross.crt"
}
```
System tests also rely on a web driver to control the browser; in most cases, these web drivers will ignore the invalid certificate warnings. To get the newer headless versions of Chrome and Firefox to play nicely with SSL, I've found that some extra configuration is required.

First, let's use the `webdrivers` gem to make sure we have the latest binaries for `chromedriver` and `geckodriver` to test against Chrome and Firefox respectively.

Previously invalid SSL certificates could not work in headless Chrome so system tests under SSL were not possible in this mode. But with the recent release of Chrome 65, this changed. We can now set up headless Chrome driver with capabilities to accept invalid SSL certificates like so:

```ruby
Capybara.register_driver(:headless_chrome_ssl) do |app|
  options = Selenium::WebDriver::Chrome::Options.new(
    args: %w[--headless --disable-gpu --no-sandbox --disable-web-security],
  )
  capabilities = Selenium::WebDriver::Remote::Capabilities.chrome(
    acceptInsecureCerts: true,
  )
  Capybara::Selenium::Driver.new(
    app,
    browser: :chrome,
    options: options,
    desired_capabilities: capabilities
  )
end
```
We can switch to our new driver in RSpec with a hook like the following:
```ruby
RSpec.configure do |config|
  config.before(:each, type: :system, js: true) do
    driven_by :headless_chrome_ssl
  end
end
```
For Firefox, the driver configuration is similar:
```ruby
Capybara.register_driver(:headless_firefox_ssl) do |app|
  options = Selenium::WebDriver::Firefox::Options.new(args: %w[--headless])

  capabilities = Selenium::WebDriver::Remote::Capabilities.firefox(
    acceptInsecureCerts: true,
  )
  Capybara::Selenium::Driver.new(
    app,
    browser: :firefox,
    options: options,
    desired_capabilities: capabilities
  )
end
```

With our server and drivers configured, we set our default Capybara app host with our custom domain on https:
```ruby
Capybara.app_host = "https://www.localhost.ross"
```
Now we're set up to run system tests over SSL!

### Requirements
Below is a list of binaries and gems with the versions used in for the [demo app](https://github.com/rossta/local-ssl-demo-rails). It may be possible to make this work with other relatively recent versions of these tools, though your mileage may vary.
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

If you're onboard with "SSL everywhere", let that include `localhost` as well. Getting SSL set up for Rails development and test requires a bit of effort, but it's easier than ever before with the introduction of Rails system tests and recent improvements to Puma, Capybara, Selenium, and the Chrome and Firefox web drivers.
