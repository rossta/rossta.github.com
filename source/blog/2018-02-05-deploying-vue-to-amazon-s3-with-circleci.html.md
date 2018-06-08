---
title: Deploying a Vue.js website to Amazon S3 with CircleCI
author: Ross Kaffenberger
published: true
summary: A continuous deployment solution for Vue.js
description: Our series on building Connect Four with Vue.js continues by setting up automated deployment to Amazon S3 with CircleCI and the command line tool s3deploy
pull_image: 'blog/stock/flower-tj-holowaychuk-unsplash.jpg'
pull_image_caption: Background Photo by Tj Holowaychuk on Unsplash
series: 'Connect Four'
category: Code
tags:
  - Vue
---

In this post, we'll walkthrough how I set up continuous deployment for my [Vue.js static website](http://connect-four-vue-abcdefg.s3-website-us-west-2.amazonaws.com/). Every time I `git push` to the primary branch of my repository, an automated process will build the project and upload any new files to Amazon S3 with the appropriate caching headers.

*This post is part of an ongoing series on [building Connect Four with Vue.js and Phoenix](/series/connect-four.html).*

Here's an overview of the tools involved:

- a Github (or similar) account
- `vue-cli`
- an AWS account
- an S3 bucket set up to host a static website
- AWS credentials for reading and writing the S3 bucket
- a CircleCI account
- a `circle.yml` configured to build and deploy the site

### From CodePen to Github

Since my version of Connect Four up to this point has been [built and hosted entirely on CodePen](https://codepen.io/rossta/pen/VydJKG), my first step was to move the source code to Github. I initialized a new `vue-cli` (version 2) using the Webpack template.

```shell
$ yarn global install vue-cli
$ vue init webpack connect-four-vue
```

With the game working and now backed by version control ([source code](https://github.com/rossta/connect-four-vue)), I was able to bundle a set of static assets suitable for deployment to a provider like S3:

```shell
$ yarn run build
```
For `vue-cli` version 2, this command builds an index file and its associated assets to the `dist/` directory. This will be important when we set up the build for continuous deployment.

<aside class="callout panel">
<p>
Though there are big changes coming to <i>vue-cli</i> in version 3, it's still in alpha and the documentation is <a href="https://github.com/vuejs/vue-cli/tree/2c61d236d77dfcb22b4560afe4c957ddf45b4337/docs">still WIP</a> as of this writing. Though the commands for initializing and building a Vue project may differ in v3, the workflow described in this post still applies.
</p>
</aside>

### The host with the most

To host on Amazon S3, I needed an S3 bucket with permissions to make its contents available to the public for static website hosting. This can be done from the [AWS console](https://aws.amazon.com):

![](blog/connect-four/s3/aws-create-bucket.jpg)

On the **Properties** pane on the bucket management page, I enabled *Static Website Hosting* and entered `index.html` as the name of the index document to match the output of the Vue build.

![](blog/connect-four/s3/aws-static-website-properties.jpg)

This screen also reveals the public endpoint for the S3 bucket index page, which is what we'll need to navigate to our deployed site in the browser. The endpoint may be something like **http://bucket-name.s3-website-region-name.amazonaws.com**.

On the **Permissions** tab, I added a bucket policy to provide public read permissions to everything in the bucket.

![](blog/connect-four/s3/aws-static-website-policy.jpg)

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

With my Github account linked to my CircleCI, I added my Connect Four Github project to CircleCI from the *Projects* tab in the CircleCI dashboard.

![](blog/connect-four/s3/circle-add-projects.jpg)

I also added a `circle.yml` file to my project similar to the following:

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
    branch: master
    commands:
      - s3deploy -source=dist/ -region=us-west-2 -bucket=connect-four-abcdefg
```
The configuration above will do several things on each `git push`:

* install npm dependencies with `yarn` and fetch the binary, `s3deploy`
* build the project with `yarn run build`
* sync build files to my S3 bucket with `s3deploy` (only on the `develop` branch)

Note that the `s3deploy` command receives a `-source=dist/` option to indicate that only files output by the build step will be synced with S3.

I like `s3deploy` for its simplicity and speed (it's written in Go). It will only upload new files or files that have changed. It also provides advanced configuration to fine tune response behavior on sets of files by route through a separate `.s3deploy.yml` file. Here's what I used to add long-term caching and gzipping for static assets in my bucket:

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
See the [`s3deploy` project page](https://github.com/bep/s3deploy) for more information on configuration options.

### Permissions please

Almost done! To give the `s3deploy` command permissionsto add and modify files in my S3 bucket, I needed a set of AWS credentials linked to another AWS authorization policy. To do this, I created a new Amazon IAM user for programmatic access in the Security Credentials panel on AWS.

![](blog/connect-four/s3/aws-add-user-1.jpg)

I added this user to a security group with the following policy:

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
Note: don't confuse this policy with your static website hosting policy!

With my new IAM user, a fresh set of credentials, an AWS access key id and secret access key, are now available to control my S3 bucket programmatically.

![](blog/connect-four/s3/aws-add-user-2.jpg)

If you follow these steps, make sure to keep your credentials in a safe place. Anyone with these credentials would be able to modify the contents of your S3 bucket with the permissions we've used.

<aside class="callout panel">
<p>
Check out <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html">the docs</a> for more information on managing Amazon IAM users.
</p>
</aside>

I added these credentials to CircleCI through its project level configuration page in the web UI.

![](blog/connect-four/s3/circle-aws.jpg)

This step makes the AWS credentials available to the build environment. It's a more secure option than adding credentials as plain text in the `circle.yml` file.

### Liftoff!

Now, when we push to Github on our primary branch, the build process on CircleCI will fetch our dependencies, bundle the static assets and compile our Vue codebase to the `dist/` directory, which will then be synced to Amazon S3. As long as the build and sync steps succeed, we ensure that the latest code is always in production with minimal fuss from the command line.

<hr />

*Did you like this post?* Please share! Even better, sign up for my newsletter to hear about new posts in my ongoing series on [building Connect Four with Vue.js and Phoenix](/blog/basic-connect-four-with-vuejs.html).
