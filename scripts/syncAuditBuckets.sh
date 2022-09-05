#!/bin/bash

# This script assumes that the AWS CLI has profiles configiured with spefic names.
# These profiles should be configured to point at the relevant admin IAM roles in the 
# sandbox and staging accounts. For more information on configuring the CLI for IAM roles
# view the documentation at:
# https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-role.html
#
# To set up these profiles, add them to the .aws/config file e.g.
#
# [profile sandbox-audit-admin]
# role_arn = arn:aws:iam::SANDBOX_ACCOUNT:role/${ADMIN_ROLE_NAME}
# source_profile = {GDS_USERS_PROFILE_NAME}
# mfa_serial = arn:aws:iam::{GDS_USERS_ACCOUNT}:mfa/{EMAIL_ADDRESS}
#
# [profile staging-audit-admin]
# role_arn = arn:aws:iam::{STAGING_ACCOUNT}:role/${ADMIN_ROLE_NAME}
# source_profile = {GDS_USERS_PROFILE_NAME}
# mfa_serial = arn:aws:iam::{GDS_USERS_ACCOUNT}:mfa/{EMAIL_ADDRESS}
#
# The source_profile will be the name of the profile for the gds-users account credentials
# which should be located in the .aws/credentials folder.

SANDBOX_ADMIN_PROFILE=sandbox-audit-admin
STAGING_ADMIN_PROFILE=staging-audit-admin
STAGING_AUDIT_BUCKET=s3://audit-staging-message-batch

read -p "Target S3 Bucket (s3://audit-sandbox-message-batch): " target
target=${target:-"s3://audit-sandbox-message-batch"}

mkdir ./tmp
aws s3 sync $STAGING_AUDIT_BUCKET ./tmp --profile $STAGING_ADMIN_PROFILE
aws s3 sync ./tmp $target --profile $SANDBOX_ADMIN_PROFILE
rm -rf ./tmp
