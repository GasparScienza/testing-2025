#!/bin/bash

docker exec -it k6-1 k6 run /scripts/load-test.js
