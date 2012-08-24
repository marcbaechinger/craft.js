#!/bin/sh
if cd $1
then
	git clone $2 $3
	exit 0
fi
exit 1