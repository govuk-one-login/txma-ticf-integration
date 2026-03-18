#!/bin/bash

# Fetches environment variables from deployed Lambda functions
# Usage: ./fetch-env-vars.sh

set -e

AWS_PROFILE=audit-dev
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="${SCRIPT_DIR}/../env-vars.json"

export AWS_REGION=eu-west-2

STACK_NAME="${JIRA_TICKET:-ticf-integration}"

discover_functions() {
    # Extract FunctionName values from template.yaml, replacing
    # !Sub ${AWS::StackName} with the actual stack name.
    grep 'FunctionName: !Sub' "$SCRIPT_DIR/../../../template.yaml" \
        | sed "s/.*!Sub \${AWS::StackName}-/${STACK_NAME}-/" \
        | tr -d ' '
}

FUNCTIONS=()
while IFS= read -r fn; do
    FUNCTIONS+=("$fn")
done < <(discover_functions)

# Variables to exclude (Dynatrace, etc.)
EXCLUDE_PATTERN="^(DT_|AWS_LAMBDA_EXEC_WRAPPER)"

echo "==> Checking AWS SSO session"
if ! aws sts get-caller-identity --profile "$AWS_PROFILE" > /dev/null 2>&1; then
    echo "==> Session expired, logging in"
    aws sso login --profile "$AWS_PROFILE"
fi

echo "==> Fetching Lambda environment variables"
MERGED="{}"
for fn in "${FUNCTIONS[@]}"; do
    echo "    $fn"
    ENV_VARS=$(aws lambda get-function-configuration \
        --function-name "$fn" \
        --profile "$AWS_PROFILE" \
        --query 'Environment.Variables' \
        --output json)
    MERGED=$(echo "$MERGED $ENV_VARS" | jq -s 'add')
done

# Filter out excluded variables, inject local overrides, and wrap in Parameters
FINAL=$(echo "$MERGED" | jq --arg pattern "$EXCLUDE_PATTERN" '
  to_entries
  | map(select(.key | test($pattern) | not))
  | from_entries
  | .NODE_OPTIONS = " "
  | .AWS_REGION = "eu-west-2"
  | .XRAY_ENABLED = "false"
  | .AWS_XRAY_CONTEXT_MISSING = "LOG_ERROR"
  | {Parameters: .}
')

echo "$FINAL" > "$OUTPUT_FILE"
echo "==> Saved to $OUTPUT_FILE"
