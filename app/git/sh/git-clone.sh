#!/bin/sh
if cd $1
then
	git clone --recursive $2 $3
	exit
fi
exit 1