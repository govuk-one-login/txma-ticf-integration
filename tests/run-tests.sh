#!/bin/bash

# This script will only run in AWS Codepipeline. It has access to the following environment variables:
# CFN_<OUTPUT-NAME> - Stack output value (replace <OUTPUT-NAME> with the name of the output)
# TEST_REPORT_ABSOLUTE_DIR - Absolute path to where the test report file should be placed
# TEST_REPORT_DIR - Relative path from current directory to where the test report file should be placed
# TEST_ENVIRONMENT - The environment the pipeline is running the tests in

# This file needs to be located at the root when running in the container. The path /test-app is defined
# in the Dockerfile.
cd /test-app || exit 1

# dev = feature-branch integration tests run on the ECS dev-tools runner (no pipeline report dir).
# build = pipeline integration tests. staging = pipeline e2e tests.
if [ "$TEST_ENVIRONMENT" == "build" ] || [ "$TEST_ENVIRONMENT" == "dev" ]; then
  NODE_OPTIONS="--experimental-vm-modules" npm run test:integration
  TESTS_EXIT_CODE=$?
  TEST_REPORT_FILE=tests/reports/results/integration-results.xml
elif [ "$TEST_ENVIRONMENT" == "staging" ]; then
  NODE_OPTIONS="--experimental-vm-modules" npm run test:e2e
  TESTS_EXIT_CODE=$?
  TEST_REPORT_FILE=tests/reports/results/e2e-results.xml
else
  echo "No Test Environment Set"
  exit 1
fi

# Copy the report to the pipeline-provided location when running in CodePipeline.
# TEST_REPORT_ABSOLUTE_DIR is not set for the dev ECS-runner flow, so skip the copy there.
if [ -n "$TEST_REPORT_ABSOLUTE_DIR" ] && [ -f "$TEST_REPORT_FILE" ]; then
  cp "$TEST_REPORT_FILE" "$TEST_REPORT_ABSOLUTE_DIR/junit.xml"
fi

exit $TESTS_EXIT_CODE
