#!/bin/bash

# This script will only run in AWS Codepipeline. It has access to the following environment variables:
# CFN_<OUTPUT-NAME> - Stack output value (replace <OUTPUT-NAME> with the name of the output)
# TEST_REPORT_ABSOLUTE_DIR - Absolute path to where the test report file should be placed
# TEST_REPORT_DIR - Relative path from current directory to where the test report file should be placed
# TEST_ENVIRONMENT - The environment the pipeline is running the tests in

yarn test:integration

TESTS_EXIT_CODE=$?

cp reports/allure-results/junit.xml $TEST_REPORT_ABSOLUTE_DIR/junit.xml

if [ $TESTS_EXIT_CODE -ne 0 ]; then
  exit 1
fi
