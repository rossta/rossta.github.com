---
title: Deploy Vue to Amazon S3 with CircleCI 2.0
author: Ross Kaffenberger
published: false
summary: Deploy Vue to Amazon S3 with CircleCI 2.0
description: Deploy Vue to Amazon S3 with CircleCI 2.0
pull_image: 'blog/stock/louvre-pexels-photo.jpg'
series:
category: Code
tags:
  - Rails
---

I recently upgraded my my [Connect Four](https://github.com/rossta/connect-four-vue) Vue.js application build from CircleCI 1.0 to 2.0. In my previous post, I described I set up a CircleCI 1.0 build to bundle Vue.js assets and upload them to an S3 bucket configured to serve the application as a static website. Now that [CircleCI is sunsetting 1.0](https://circleci.com/blog/sunsetting-1-0/) it's time to switch to 2.0. In this post, I'll describe the steps necessary to update my CircleCI 1.0 configuration.

Refer back to my previous post to see how I set up an Amazon S3 bucket to serve a static website and integrate with CircleCI 1.0.

```yaml
version: 2
jobs:
  build:
    docker:
      - image: circleci/node:8.11.2
    parallelism: 1
    working_directory: ~/rossta/connect-four-vue
    steps:
      - checkout
      - attach_workspace:
          at: ~/rossta/connect-four-vue
      - restore_cache:
          key: v1-yarn-{{ checksum "yarn.lock" }}
      - run: yarn install
      - save_cache:
          key: v1-yarn-{{ checksum "yarn.lock" }}
          paths:
            - ./node_modules
      - run: yarn run build
      - persist_to_workspace:
          root: .
          paths: dist

  deploy:
    docker:
      - image: circleci/golang:1.9.6
    parallelism: 1
    working_directory: ~/rossta/connect-four-vue
    steps:
      - checkout
      - attach_workspace:
          at: ~/rossta/connect-four-vue
      - restore_cache:
          key: v1-pkg-cache
      - run: go get -v github.com/bep/s3deploy
      - save_cache:
          key: v1-pkg-cache
          paths:
            - /go/pkg
      - run:
          name: Deploy to S3
          command: |
            s3deploy -source=dist/ -region=us-west-2 -bucket=rossta-connect-four

workflows:
  version: 2
  build-and-deploy:
    jobs:
      - build
      - deploy:
          requires:
            - build
          filters:
            branches:
              only: master
```
