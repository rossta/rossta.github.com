---
title: Deploying a Vue.js website to Amazon S3 with CircleCI
author: Ross Kaffenberger
published: false
summary: A continuous deployment solution with Vue.js
description: Our series on building Connect Four with Vue.js continues by setting up automated deployment to Amazon S3 with CircleCI and the command line tool s3deploy
pull_image: 'blog/purple-circles.jpg'
pull_image_caption: Background Photo by Peter Clarkson on Unsplash
series: 'Connect Four'
category: Code
tags:
  - Vue
---

In this post, we'll walkthrough how I set up continuous deployment for my Vue.js static web version of Connect Four. Every time I `git push` to the primary branch of my repository, an automated process will build the project then upload any new files to Amazon S3 with the appropriate caching headers.

Here's an overview of the tools involved:

- a Github (or similar) account
- vue-cli
- an AWS account
- an S3 bucket set up to host a static website
- AWS credentials for reading and writing the S3 bucket
- a CircleCI account
- a circle.yml configured to build and deploy the site

### From CodePen to GitHub with vue-cli

Since my implementation of the Connect Four game was previously implemented and hosted entirely on CodePen.io, my first step was to move the source code to Github. I initialized the project with `vue-cli` (v2) using the Webpack template.

```shell
$ yarn global install vue-cli
$ vue init webpack connect-four-vue
```

With a working implementation of the game in place ([source code]()), the project can be built with
```shell
$ yarn run build
```
For `vue-cli` version 2, this command builds an index file and its associated assets to the `dist/` directory. This will be important when we set up the build for continuous deployment.

<aside class="callout panel">
Though there are big changes coming to `vue-cli` in version 3, it's still in alpha and the documentation is [still WIP](https://github.com/vuejs/vue-cli/tree/2c61d236d77dfcb22b4560afe4c957ddf45b4337/docs) as of this writing. Though the commands for initializing and building a Vue project, the workflow described in this post still applies.
</aside>

### The host with the most

To accomplish set up hosting on S3, I first needed to set up a new S3 bucket with the necessary permissions to make its contents available to the public for static website hosting. I'll detail the steps I took:

First, I created an S3 bucket by navigating to the S3 section on the [AWS console](https://aws.amazon.com).

image

I skipped through the other sections in the Create a Bucket wizard and navigated to the *Properties* pane on the bucket management page. Here I enabled *Static Website Hosting* and entered `index.html` as the name of the index document to match the output of the Vue build.

image

This screen also reveals the public endpoint for the S3 bucket index page, which is what we'll need to navigate to our deployed site in the browser. For this demo, my site is located at http://connect-four-vue-abcdefg.s3-website-us-west-2.amazonaws.com/

Next, I added a bucket policy to provide public read permissions to everything in the bucket.

image

The  AWS docs recommend the following policy for static website hosting. If setting this up for your own bucket, be sure to replace `bucket-name` in the *Resource* string with your bucket name:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadForGetBucketObjects",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::bucket-name/*"
        }
    ]
}
```
For more information on setting up static websites on Amazon S3, check out Kyle Galbraith's [How to host a website on S3 with getting lost in the sea](https://medium.freecodecamp.org/how-to-host-a-website-on-s3-without-getting-lost-in-the-sea-e2b82aa6cd38), which also touches on costs and custom domain setup. Connor Leech wrote a nice post on [hosting a Vue.js website on Amazon S3](https://medium.com/@connorleech/host-a-vue-js-website-on-amazon-s3-for-the-best-hosting-solution-ever-%EF%B8%8F-eee2a28b2506) with manual file upload, which I used as my starting point. The AWS documentation provides a [general walkthrough](https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html) as well.

### Automatic for the people

For continuous deployment, I chose CircleCI 1.0 since I'm most familiar with its configuration options and it's currently free for my needs.

With an account on CircleCI linked to my Github account, I added my Connect Four Github project to CircleCI from the *Projects* tab in the CircleCI dashboard.

I then added a `circle.yml` file to my project similar to the following:

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
  override
    - yarn run build

deployment:
  s3up:
    branch: develop
    commands:
      - s3deploy -source=dist/ -region=us-west-2 -bucket=my-bucket-name
```
The configuration above will do several things on each `git push`:

* install npm dependencies with `yarn` and fetch the binary, `s3deploy`
* build the project with `yarn run build`
* upload new files to my S3 bucket (only on the `develop` branch) in the deploy step with `s3deploy`

I also update some environment variables to add executables to the project `PATH`. Note that the `s3deploy` command receives a `-source=dist/` option to indicate that only files output by the build step will be synced with S3.

I like `s3deploy` for its simplicity and speed (it's written in Go). It will only upload new files or files that have changed. It also provides a mechanism for configuring response headers on specific files or groups of files based on a separate `.s3deploy.yml` file. Here's what I used to add long-term caching to static assets in my bucket:
```yaml
routes:
    - route: "^.+\\.(js|css|svg|ttf)$"
      #  cache static assets for 20 years
      headers:
         Cache-Control: "max-age=630720000, no-transform, public"
      gzip: true
    - route: "^.+\\.(png|jpg)$"
      headers:
         Cache-Control: "max-age=630720000, no-transform, public"
      gzip: true
    - route: "^.+\\.(html|xml|json|js)$"
      gzip: true
```
See the [project's Github page](https://github.com/bep/s3deploy) for more information on configuration options.
### Permissions please

Not so fast! There's one more step. I needed to provide my `s3deploy` command with proper credentials to modify files in the S3 bucket. To do this, I created a new IAM user on Amazon S3 and added it to a policy group with the following policy:

```json
{
   "Version": "2012-10-17",
   "Statement":[
      {
         "Effect":"Allow",
         "Action":[
            "s3:ListBucket",
            "s3:GetBucketLocation"
         ],
         "Resource":"arn:aws:s3:::<bucketname>"
      },
      {
         "Effect":"Allow",
         "Action":[
            "s3:PutObject",
            "s3:PutObjectAcl",
            "s3:DeleteObject"
         ],
         "Resource":"arn:aws:s3:::<bucketname>/*"
      }
   ]
}
```
Note: don't confuse this policy with the one associated with your static website hosting policy!

Once the new IAM user is successfully added, an access key id and secret access key is created. CircleCI provides a project level configuration page in their web UI for making these AWS credentials available to the build environment. This approach is a more secure option over passing the credentials as plain text in the `circle.yml` file`.
