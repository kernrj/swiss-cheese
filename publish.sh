#!/bin/bash -e

rm -fr node_modules
npm i
node_modules/typescript/bin/tsc
npm test
npm publish
