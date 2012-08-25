#!/bin/sh
if cd $1
then
	git clone $2 $3
	exit
fi
exit 1