---
title: Building a Webcrawler in Ruby Part I
author: Ross Kaffenberger
published: false
summary: Using Ruby's Enumerable to enumerate website page data
description: Using Ruby's Enumerable to enumerate website page data
pull_image: 'https://rossta.net/assets/images/blog/stock/aerial-highway-nightime-bangkok.jpg'
series: Enumerable
tags:
- Code
- Ruby
---

# Outline

## Part I

Breakdown problem
* Exploring tree
* Capturing data and urls to consume

Designing the surface
* Enumerable - familiar API
* Laziness - ability to optimize
* Flexibility - persisting data example

Writing the crawler
* Preparing the framework
* Capturing URLs with "infinite" enumerator
* Cliff hanger

## Part II

Recap
* Problem
* Solution design

Enumerating URLs
* Capturing URLs with "infinite" enumerator

Enumerating Results
* Respecting delays
* Yielding data

Usage
* Storing results

Going further
* Parallelism

