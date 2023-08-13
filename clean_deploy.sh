#!/bin/bash

rm -rf dist .parcel-cache
npm run build
cd ..
[[ -d annolangen.github.io ]] || git clone https://github.com/annolangen/annolangen.github.io.git
rm -rf annolangen.github.io/todo/*
cp todo/dist/* annolangen.github.io/todo
cd annolangen.github.io
git add todo
git commit -m "Redeploy todo $(date -I)"
git push
