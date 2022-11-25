#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Start Allure services & generate reports
docker compose -f ${SCRIPT_DIR}/docker-compose.allure.yaml up -d

# Wait for UI to become available
while ! curl --fail --silent --head http://localhost:5252; do
  sleep 1
done

# Wait a bit longer so browser doesn't start before JS and CSS ready
sleep 10

# Open browser at latest report
open http://localhost:5252/allure-docker-service-ui/projects/default
