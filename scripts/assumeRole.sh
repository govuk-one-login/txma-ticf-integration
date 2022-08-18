#!/usr/bin/env bash

# To run this script requires you to have the following environment variables set:
# GDS_EMAIL_ADDRESS - the email address of the account for the 'gds-users' AWS account
# ROLE_ARN - the ARN of the role you want to assume in the relevant AWS account
: "${GDS_EMAIL_ADDRESS:?Not set or empty}"
: "${ROLE_ARN:?Not set or empty}"

# Pass in the MFA code as the first argument when running the script
# e.g.
# source ./scripts/assumeRole.sh 123456
MFA_CODE=$1

# Script assumes you are authenticated with the 'gds-users' AWS account via the AWS credentials file
# The required environment variables are unset by this script and replaced with the credentials for the Assumed role
unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY
unset AWS_SESSION_TOKEN

ACCOUNT_ID=$(aws sts get-caller-identity | jq -r '.Account') || { return 1 }
MFA_DEVICE_ARN=arn:aws:iam::${ACCOUNT_ID}:mfa/$GDS_EMAIL_ADDRESS
MFA_CREDENTIALS=$(aws sts get-session-token --serial-number $MFA_DEVICE_ARN --token-code $1) || { return 1 }
ASSUMED_ROLE=$(AWS_ACCESS_KEY_ID=$(echo $MFA_CREDENTIALS | jq -r '.Credentials.AccessKeyId') \
  AWS_SECRET_ACCESS_KEY=$(echo $MFA_CREDENTIALS | jq -r '.Credentials.SecretAccessKey') \
  AWS_SESSION_TOKEN=$(echo $MFA_CREDENTIALS | jq -r '.Credentials.SessionToken') \
  aws sts assume-role --role-arn $ROLE_ARN --role-session-name session) || { return 1 }

export AWS_ACCESS_KEY_ID=$(echo $ASSUMED_ROLE | jq -r '.Credentials.AccessKeyId')
export AWS_SECRET_ACCESS_KEY=$(echo $ASSUMED_ROLE | jq -r '.Credentials.SecretAccessKey')
export AWS_SESSION_TOKEN=$(echo $ASSUMED_ROLE | jq -r '.Credentials.SessionToken')

echo "AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID"
echo "AWS_SECRET_ACCESS_KEY_ID: $AWS_SECRET_ACCESS_KEY"
echo "AWS_SESSION_TOKEN: $AWS_SESSION_TOKEN"
