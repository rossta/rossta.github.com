---
title: Seven reasons choose Vue.js in 2019
author: Ross Kaffenberger
published: true
summary: i.e., Because it's so darn fun
description: This post describes a bunch of reasons why developers might enjoy choosing Vue.js as the next JavaScript framework to learn in the coming year.
thumbnail: 'blog/stock/john-moeses-bauan-skyline-unsplash.jpg'
thumbnail_caption: Photo by John Moeses Bauan on Unsplash
series:
category: Code
tags:
  - Vue
---

I love building applications in Vue.js and here's why I think the future is looking bright for the framework and its community.

### 1. No build step required

A critical aspect of the Vue philosophy is it be easy to get started. Unlike some other popular frameworks, it's not necessary to use a complex build tool like webpack to build an application with it. Just include a script tag pointing to the [latest release for development or production](https://vuejs.org/v2/guide/installation.html#Direct-lt-script-gt-Include), and you have access to the Vue runtime.

```javascript
<script src="https://cdn.jsdelivr.net/npm/vue@2.5.21/dist/vue.js"></script>
```
Having a low barrier to entry makes Vue a worthy consideration as a first JS framework to learn.

### 2. A world-class command line interface

Of course, many developers are looking for advanced development features like ES or TypeScript transpilation, hot module replacement, and tree-shaking, made possible by build tools. Vue has you covered there as well.

```
npm install -g @vue/cli
vue create my-project
```

This past year, the Vue core team re-wrote their command line interface from the ground up, resulting in Vue CLI 3. It's designed in such a way to promote best practices and a full-featured default webpack configuration that should be easier to extend without making it difficult to upgrade, i.e., "no need to eject." Vue CLI provides a ton of useful additional features, including an interactive project initialization wizard (available through the terminal or a web-based UI), a plugin system to support generators and configuration for community add-ons, and the ability to specify alternative build targets, like web components or as libraries.

### 3. Friendly learning curve

A common criticism I hear about Vue is that its API has a larger surface area than some other popular frameworks and I agree up to a point (depending on the framework). Ironically, one thing I hear [over](https://hackernoon.com/should-you-learn-react-or-vue-first-7dc0d4dd8c04) and [over](https://www.quora.com/How-does-Vue-js-compare-to-React-js) in some of these comparisons are Vue is easy to learn. Though this point is subjective and anecdotal, this has held for folks I've heard from regardless of previous experience with JavaScript frameworks and JavaScript in general.

One reason for this, I believe, is that Vue is a "progressive JavaScript framework."

![Vue is a Progressive JavaScript Framework](blog/vue/vuejs.org-homepage.png)

No need to learn the whole API to get started with Vue, no need to learn a new syntax like JSX; only basic HTML, CSS, and JS knowledge is required to get started.

### 4. A solid ecosystem

Before Vue, I've gotten frustrated with the fractured nature of learning best practices beyond the basics. What client-side router should I use? Which data management/Flux implementation should I use? How do I test my components? How should I configure my build system? Over time, answering these questions has gotten easier, depending on the community, but I've liked Vue's approach since the start.

Vue provides official support for several essential add-ons, including `vue-router` for client-side routing, `vuex` for managing state, `vue-test-utils` for unit testing components, the `vue-devtools` browser extension for debugging, Vue CLI as described earlier. None of these tools are required Vue can work quite well with alternatives for these libraries, like `redux` or `mobx` instead of `vuex`, or another router. The critical point is that the community assists developers by supporting a set of very good recommended defaults, something that a backend framework like Ruby on Rails has traditionally done very well.

### 5. The Vue instance

The most potent aspect Vue is its [reactivity system](https://codingexplained.com/coding/front-end/vue-js/understanding-vue-js-reactivity). We can tap into it through [the `Vue` instance](https://vuejs.org/v2/guide/instance.html).

```javascript
new Vue({
  el: "#app",
})
```

This invocation is how every Vue application is initialized. It also creates a fully-reactive root component of the application. A Vue instance can also be used as an event bus or for tracking dependency changes separately from the application component tree, say, as an implementation detail of a Vue plugin.

Vue's reactivity system is beautiful in its simplicity. Playing with the Vue instance is an excellent way to understanding how the reactivity system works and level up one's Vue, and JavaScript, skills in general.

### 6. Vue 3 lands this year

Speaking of Vue's reactivity system, [Vue 3 is expected to ship this year](https://medium.com/the-vue-point/plans-for-the-next-iteration-of-vue-js-777ffea6fabf). Among some architectural and performance improvements and minor API changes, Vue 3 provides a new Proxy-based implementation of its reactivity system.

The Proxy-based system solves [some of the known caveats with Vue change detection](https://vuejs.org/v2/guide/reactivity.html#Change-Detection-Caveats):

In Vue 2, Vue cannot:

1. Detect property addition, e.g., `vm.b = 2`
2. Detect array modification through indexing or modifying length, e.g., `arr[0] = 2`

* The workound: use `Vue.set`, e.g., `Vue.set(vm, 'b', 2)`

Vue 3 Proxy-based reactivity makes these annoying issues go away.

### 7. An amazing community

Since I've started using Vue, I've been fortunate to learn from a variety of Vue developers through forums, on Twitter and GitHub, and at local meetups. Vue has a distributed, hard-working core team, who are continually improving the framework without over-burdening developers with a bunch of fringe features or painful upgrades. The [Vue forums](https://forum.vuejs.org/) is a great way to get insight from experts on tricky issues. Vue conferences, like [VueConf.us](https://vueconf.us/) and [Vue Amsterdam](https://www.vuejs.amsterdam/), a great way to connect with other members of the community and attend more in-depth workshops, are already taking place all over the world. There's also [Vue Vixens](https://vuevixens.org/), an organization that provides safe environments for people who identify as women to learn Vue.js.

### Bonus. It's just plain fun

I got my start in web development just as the Ruby and the Rails framework was taking off. One thing I have always loved about Ruby is creator Yukihiro Matsumoto's explicit (and, dare I say, audacious) goal of inventing a language optimized for developer happiness.

I get these same feelings when I build interfaces with Vue.js. I was spending less time wrestling with configuration and APIs and more time building and having fun doing it.

While I don't know that Vue.js was created so explicitly in the name of developer happiness, for, it has and continues to be fulfilling to that end. It's something I hear from many others who've taken time to learn the framework and probably the most important reason I'll recommend Vue.js in 2019.

---

So what are you waiting for? Best of luck with your Vue.js journey in the coming year.
