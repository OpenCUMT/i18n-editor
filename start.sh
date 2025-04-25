#!/bin/sh

if [ ! -f /data/config.toml ]; then
  cp config.default.toml /data/config.toml
fi

nginx &

bun start