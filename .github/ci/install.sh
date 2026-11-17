#!/usr/bin/env bash
set -e
npm --prefix server install && npm --prefix client install && npm --prefix tests install
