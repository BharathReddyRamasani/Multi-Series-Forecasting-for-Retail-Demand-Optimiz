#!/usr/bin/env bash
# Simple load test for the forecast endpoint using 'hey'
# Requires 'hey' (https://github.com/rakyll/hey) to be installed.
# Adjust parameters as needed.

BASE_URL="http://localhost:8000/api/forecast"
DATA='{"store":1,"item":1,"horizon":30,"model_type":"lightgbm","start_date":"2022-12-31"}'

# Example: 200 requests with 20 concurrent workers
hey -n 200 -c 20 -m POST -d "$DATA" -H "Content-Type: application/json" "$BASE_URL"
