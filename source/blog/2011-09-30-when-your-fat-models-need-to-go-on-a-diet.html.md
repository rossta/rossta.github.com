---
title: When Your Fat Models Need to Go on a Diet
author: Ross Kaffenberger
summary: Thoughts on refactoring large model classes in Rails
pull_image: 'blog/stock/logs-pexels-photo.jpg'
category: Code
tags:
  - Ruby
  - Rails
---
Most Rails apps I’ve worked on have followed the pattern “[skinny controllers, fat models][1].” The controller shouldn’t have know what attributes and joins to make when asking for data from the models; one line methods calls in controller actions are a thing of beauty. Controller specs are simplified and the complexity of business logic and database access can be stuffed into the models. Fatten’ up those models!

But what happens when your models grow too large? It’s common to have one or two models (Users and Groups, anyone?) carry a large burden. Over time, we see Ruby files approaching and surpassing thousands of lines and their associated tables accumulating column excess. Before you know it, it’s time to put your models on a diet. It’s useful to have some patterns in your tool-belt to start trimming the fat.

A good refactoring step is to pull out modules of related behavior. In the User model, for example, we might extract modules for related instance methods, associations and validations for functional scopes like admin access or group memberships. I prefer to namespace the modules under UserExtensions so it’s clear, at least in this case, that these are meant for composition of the User model rather than for sharing code across objects. Now ActiveSupport::Concern makes it super-simple to define both instance and class methods in your module and ensure they’re included properly. (Some good reading on [better ruby idioms][2] for [mixing in class and instance methods][3]).

One convention is to place the modules in “#{model\_name}\_extensions” folders in your app/models directory to group the code logically. For example, UserExtensions::Admin would be located at app/models/user\_extensions/admin.rb. Breaking out the code in to functional chunks like this is a good first step in downsizing your model files. It also more easily allows methods and associations to be extracted into other classes/tables.

Added: Check out [part 2][4] of this post for thoughts on slimming down our models at runtime.

[1]:	http://weblog.jamisbuck.org/2006/10/18/skinny-controller-fat-model "the buckblogs here"
[2]:	http://yehudakatz.com/2009/11/12/better-ruby-idioms/
[3]:	http://www.fakingfantastic.com/2010/09/20/concerning-yourself-with-active-support-concern/
[4]:	/when-your-fat-models-need-to-go-on-a-diet-part-2/ "When Your Fat Models Need to Go on a Diet, Part 2"
