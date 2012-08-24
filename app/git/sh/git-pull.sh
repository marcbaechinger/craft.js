#!/bin/sh
if cd $1
then
   git pull
   exit 0
fi
exit 1