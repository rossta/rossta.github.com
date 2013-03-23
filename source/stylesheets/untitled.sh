#!/bin/bash

set -e

need_rails=1

if [ $# -gt 0 ]; then # we have args
  filename=$1
  grep_filename=`echo $1 | sed 's/:.*//g'`

  (set +e; grep -r 'spec_helper' $grep_filename) > /dev/null
  if [ $? -eq 1 ]; then # no match, stand-alone spec
    need_rails=''
  fi
else # no args
  filename='spec'
fi

command 'rspec'

if [ $need_rails ]; then
  command="ruby -$ bundle exec $command"
fi

RAILS_ENV=test $command $filename
