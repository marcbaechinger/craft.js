#!/bin/sh
if cd $1
then
   git log -n $2
   exit 0
fi
exit 1