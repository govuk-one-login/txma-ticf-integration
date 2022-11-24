#!/bin/bash

yarn test:integration

cp integration-tests/reports/allure-results/junit.xml $TEST_REPORT_ABSOLUTE_DIR/junit.xml
