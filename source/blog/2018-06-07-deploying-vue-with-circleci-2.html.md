---
title: Deploying Vue with CircleCI 2.0
author: Ross Kaffenberger
published: true
summary: An updated continuous deployment solution for Vue.js
description: Our series on building Connect Four with Vue.js continues by setting up automated deployment to Amazon S3 with CircleCI and the command line tool s3deploy
pull_image: 'blog/stock/hieu-vu-minh-bridge-unsplash.jpg'
pull_image_caption: Photo by Hieu Vu Minh on Unsplash
series: 'Connect Four'
category: Code
tags:
  - Vue
---

I recently upgraded my [Connect Four](https://github.com/rossta/connect-four-vue) Vue.js application to build on CircleCI 2.0 . In my [previous post](/blog/deploying-vue-to-amazon-s3-with-circleci.html), I showed how I used continuous integration on CircleCI 1.0 to bundle Vue.js assets and upload them to an S3 bucket configured to serve the application as a static website. Now that [CircleCI is sunsetting 1.0](https://circleci.com/blog/sunsetting-1-0/), I revisit my configuration and update it for 2.0. Here's how I did it.

The basic steps of the build are the same: once I push changes to GitHub, CircleCI will detect those changes and trigger a build. That build will bundle the app using the `vue-cli` command mapped to `yarn run build`. The assets output from that step will then be uploaded to S3 using the `s3deploy` golang package only if the build is running against master.

### The old config

For reference, here is the old configuration I had been using to deploy the application on CircleCI 1.0.

```yaml
machine:
  environment:
    CIRCLE_BUILD_DIR: $HOME/$CIRCLE_PROJECT_REPONAME
    PATH: $PATH:$CIRCLE_BUILD_DIR/bin:${HOME}/${CIRCLE_PROJECT_REPONAME}/node_modules/.bin"

  post:
    - mkdir -p $CIRCLE_BUILD_DIR/bin
  node:
    version: 8.9.1

dependencies:
  pre:
    - go get -v github.com/bep/s3deploy
  override:
    - yarn
  cache_directories:
    - ~/.cache/yarn
    - bin

test:
  override:
    - yarn run build

deployment:
  s3up:
    branch: master
    commands:
      - s3deploy -source=dist/ -region=us-west-2 -bucket=rossta-connect-four
```

CircleCI 2.0 offers a number of features to give developers more control and flexibility. This does mean that configuration is more complex than it was in 1.0. A couple of key improvements include [workflows](https://circleci.com/blog/introducing-workflows-on-circleci-2-0/) and the ability to run builds Docker containers. We'll take advantage of both to deploy Vue.js to S3.

Workflows are useful when you need to split a build up into a number of jobs. Those jobs may have different dependencies, or in some cases, may run in parallel. Since I want to bundle assets on all branches, but only deploy from the primary (`master`) branch, it makes sense for me to split my CircleCI 2.0 configuration into two jobs, which I'll call `build` and `deploy`. It's worth noting that, even though these jobs must share resources (the bundled assets), I can configure them to run from different Docker containers; this is necessary because the primary language dependency in the build step is node.js and in the deploy phase, it's golang.

### The build job

Here's what the build step looks like in my new CircleCI 2.0 config:

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
```

This job will build from the `circleci/node:8.11.2` base Docker image. Though any Docker image can be used, CircleCI-supported images are prepared with tools that are typically needd for most builds. ([Here's a list of pre-built CircleCI Docker images](https://circleci.com/docs/2.0/circleci-images/)). The key entries here include `restore_cache` and `save_cache` keys that will help ensure the build doesn't need to install node modules on each build when the `yarn.lock` file hasn't changed. More importantly, the `attach_workspace` and `persist_to_workspace` entries allow us to share the build output to the `dist/` directory across jobs.

### The deploy job

Here's the configuration used to upload assets to S3.

```yaml
version: 2
jobs:
  # ...
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
```
For the deploy, we need a golang base image to run the `s3deploy` command. A key step in this job is the `attach_workspace` entry, which will contain the `dist/` build output we persisted in the build job. That `dist/` directory is the source given to the `s3deploy` command. The deploy job also specifies `restore_cache` and `save_cache` for the `s3deploy` go package.

One piece not shown in the config file are the AWS credentials needed to upload the assets to S3. The `s3deploy` command will implicitly look for the environment variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. Since I do not want to publish these credentials to Github, I added them through the CircleCI web interface using [these instructions](https://circleci.com/docs/2.0/env-vars/#setting-an-environment-variable-in-a-project).

### The workflow

Finally, to tie these jobs together, I'm using a workflow as shown below:

```yaml
version: 2
# ...
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


### Putting it all together

Here's the complete configuration for CircleCI 2.0 at the time of this writing, located at [`.circleci/config.yml`](https://github.com/rossta/connect-four-vue/blob/master/.circleci/config.yml).

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

It's worth mentioning that this configuration could easily be adapted to deploy a Vue.js application to a different target by replacing the deploy job with a different set of applicable steps.

By the way, this blog is also a static website built and published to Github pages via CircleCI. I recently upgraded to its config to 2.0, which you can [check out here](https://github.com/rossta/rossta.github.com/blob/develop/.circleci/config.yml) if you're interested. CircleCI 1.0 goes dark at the end of August, 2018, so upgrade your configurations soon!
