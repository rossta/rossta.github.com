---
title: Automatic Backups to Amazon S3 are Easy
author: rossta
published: false
---

You have good reason to backup your files. Amazon S3 is a cost-effective storage option. It doesn't take the place of a dedicated drive that you own, it can be useful for redundancy nonetheless. With a few easy command-line steps (plus some pre-requisites), you can set up your machine to automate backups to S3 in no time.

## Pre-requisites

- An [Amazon web services account](http://aws.amazon.com/) and [your Amazon access credentials](http://aws.amazon.com/iam/)
- `s3cmd`: command line interface to S3.
- `cron`

As of this writing, Mac users can install with `brew install s3cmd` and Linux users can use `yum install s3cmd` or `apt-get install s3cmd` depending on the distribution.

Optional:

- `gpg`: opensource encryption program

## Setup

First you'll need to configure s3cmd: `s3cmd --configure`. Have your Amazon access key and secret key at the ready.

If you plan to store sensitive data on S3, enter the path to your `gpg` executable; `s3cmd` will encrypt your data before transferring from your machine to S3. It also decrypts when downloading to your machine. Keep in mind, encrypted files won't be readable by others with direct access.

Here's a sample result:

```
$ s3cmd --configure

Enter new values or accept defaults in brackets with Enter.
Refer to user manual for detailed description of all options.

Access key and Secret key are your identifiers for Amazon S3
Access Key: xxxxxxxxxxxxxxxxxxxx
Secret Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Encryption password is used to protect your files from reading
by unauthorized persons while in transfer to S3
Encryption password: xxxxxxxxxx
Path to GPG program: /usr/local/bin/gpg

When using secure HTTPS protocol all communication with Amazon S3
servers is protected from 3rd party eavesdropping. This method is
slower than plain HTTP and can't be used if you're behind a proxy
Use HTTPS protocol [No]: Yes

New settings:
  Access Key: xxxxxxxxxxxxxxxxxxxx
  Secret Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  Encryption password: xxxxxxxxxx
  Path to GPG program: /usr/local/bin/gpg
  Use HTTPS protocol: True
  HTTP Proxy server name:
  HTTP Proxy server port: 0

Test access with supplied credentials? [Y/n] Y
Please wait...
Success. Your access key and secret key worked fine :-)

Now verifying that encryption works...
Success. Encryption and decryption worked fine :-)

Save settings? [y/N] y
Configuration saved to '$HOME/.s3cfg'
```

## Backup

Now all you need is a file to backup and an S3 bucket to store it.

Let's say you're a web developer like me and you want to back up your MySQL or Postgres development data. First, generate the backup file (you may need to add database credentials command-line options, of course):

```
# mysql
$ mysqldump my_app_development > backup-`date +%Y-%m-%d`.sql

# or postgres
$ pg_dump my_app_development > backup-`date +%Y-%m-%d`.sql
```

You can use `s3cmd` to create a bucket. This is essentially a top-level directory in your S3 account. Since bucket names must be using to *all* S3 users, you won't be able to call it something like "backups". It's helpful to use a prefix like your email or handle.

Creates an S3 bucket called 'myname-backups':

```
$ s3cmd mb s3://myname-backups
```

Now you're ready to deliver. Encrypt and send your sql dump file to your new S3 bucket:

```
$ s3cmd put backup-2014-02-01.sql s3://myname-backups/backup-2014-02-01.sql --encrypt
```

You can verify it's in the bucket:

```
$ s3cmd ls s3://myname-backups/
2014-02-01 22:32   1109702   s3://rossta-backups/test/backup-2014-02-01.sql
```

And retrieve it (with automatic decryption when performed on your machine):

```
s3cmd get s3://myname-backups/backup-2014-02-01.sql
```

`s3cmd` supports a wide range of configuration options beyond those entered during the setup phase.Once set, your global configuration is editable in your `.s3cfg` file, typically saved in your home directory. You can also set options at the command line.

## Automate

Backups are all good but performing backups on a regular basis is even better. Like saving money, to get done when automated. Let's add a cron task:

```
#!/usr/bin/env bash

TIMESTAMP=$(date +%Y-%m-%d)
TEMP_FILE=$(mktemp tmp.XXXXXXXXXX)
S3_FILE="s3://myname-backups/local/data/backup-$TIMESTAMP"
pg_dump directory_development > $TEMP_FILE
s3cmd put $TEMP_FILE $S3_FILE --encrypt
rm "$TEMP_FILE"
```
Save this in a directory for your local scripts, like `$HOME/bin/database_backup.sh` and add execute permissions with `chmod +x ~/bin/database_backup.sh`.

To edit your crontab:
```
$ crontab -e
```
Set it to run everyday at 10PM:

```
# Backup database to S3 daily
* 22 * * * /Users/yourname/bin/database_backup.sh
```
Easy, right?

