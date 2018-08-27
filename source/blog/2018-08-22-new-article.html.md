---
title: New Article
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

This tweet: https://twitter.com/getify/status/1023202051902373888
Summary of the benefits of SSL in local development

1. Any JS front-end logic that does URL parsing (routing, history, redirects)
1. Ensuring absolute URLs are https or protocol relative (://domain.tld) to avoid mixed content warnings
1. Any CORS logic that may cross http or https boundaries
1. Certain web platform features require (or behave differently in) like geolocation, or are moving in that direction for security/privacy reasons and not all browsers (including some on mobile) treat localhost universally as a secure context
1. Websockets... you almost always want secure websockets (wss) as the upgrade from https but that doesn't happen (and thus doesn't get tested) when http on localhost
1. Features like cookies behave very differently across http vs https boundaries. For example, you may want to specify "Secure" in a cookie, and test/verify that prevents insecure access.
1. Your local server may serve certain headers (like HSTS or specific CORS allow-* headers) that require/expect real https
1. You local server logic may have request URL parsing/routing logic that treats http differently than https (such as redirects, etc)
1. Your server logic is configured itself with certs/keys to be able to do https in production.

Running SSL on localhost

https://www.remotesynthesis.com/blog/running-ssl-localhost

Stress-free SSL on OSX for development

https://gist.github.com/jed/6147872

1. Install and configure dnsmasq

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
  CN = *.${PWD##*/}.$(whoami)
  [v3_req]
  keyUsage = keyEncipherment, dataEncipherment
  extendedKeyUsage = serverAuth
  subjectAltName = @alt_names
  [alt_names]
  DNS.1 = *.${PWD##*/}.$(whoami)
  DNS.2 = ${PWD##*/}.$(whoami)
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
