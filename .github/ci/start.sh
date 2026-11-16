#!/usr/bin/env bash
set -e
mkdir -p /tmp/mern-todo-db && mongod --dbpath /tmp/mern-todo-db --port 27018 --bind_ip 127.0.0.1 >/tmp/mern-todo-mongod.log 2>&1 & sleep 3; PORT=5000 MONGO_URI=mongodb://127.0.0.1:27018/mern-todo node server/index.js & exec npm --prefix client run dev -- --host 127.0.0.1 --port 5173 --strictPort
