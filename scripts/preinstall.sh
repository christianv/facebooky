#!/bin/sh

echo "Running preinstall.sh"

echo $PATH
pwd
WORKING_DIR_BIN="$(pwd)/bin"

export PATH="$WORKING_DIR_BIN:$PATH"

echo $PATH
