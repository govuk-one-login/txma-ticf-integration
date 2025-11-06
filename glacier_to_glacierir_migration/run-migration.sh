#!/bin/bash

set -e

# Script to run migration scripts with validation and logging
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATION_DIR="$SCRIPT_DIR"

# Function to show usage
show_usage() {
    echo "Usage: $0 <script_name> [options]"
    echo ""
    echo "Scripts:"
    echo "  migration-step1.sh  - Create manifest and restore job"
    echo "  migration-step2.sh  - Create backup job"
    echo "  migration-step3.sh  - Create migration job"
    echo ""
    echo "Options:"
    echo "  --environment ENV     Environment (build|staging|production)"
    echo "  --aws-account-id ID   AWS Account ID"
    echo "  --source-bucket NAME  Source bucket name"
    echo "  --dest-bucket NAME    Destination bucket name"
    echo "  --prefix PREFIX       Object prefix filter"
    echo "  --help               Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 migration-step1.sh --environment build"
    echo "  $0 migration-step2.sh --environment staging --prefix 2024/"
}

# Parse arguments
SCRIPT_NAME=""
ENVIRONMENT=""
AWS_ACCOUNT_ID=""
SOURCE_BUCKET=""
DEST_BUCKET=""
PREFIX=""

while [[ $# -gt 0 ]]; do
    case $1 in
        migration-step*.sh)
            SCRIPT_NAME="$1"
            shift
            ;;
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --aws-account-id)
            AWS_ACCOUNT_ID="$2"
            shift 2
            ;;
        --source-bucket)
            SOURCE_BUCKET="$2"
            shift 2
            ;;
        --dest-bucket)
            DEST_BUCKET="$2"
            shift 2
            ;;
        --prefix)
            PREFIX="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate required arguments
if [[ -z "$SCRIPT_NAME" ]]; then
    echo "Error: Script name is required"
    show_usage
    exit 1
fi

if [[ ! -f "$MIGRATION_DIR/$SCRIPT_NAME" ]]; then
    echo "Error: Script $SCRIPT_NAME not found in $MIGRATION_DIR"
    exit 1
fi

# Set environment variables
export ENVIRONMENT="${ENVIRONMENT:-build}"
export AWS_ACCOUNT_ID="$AWS_ACCOUNT_ID"
export SOURCE_BUCKET="$SOURCE_BUCKET"
export DEST_BUCKET="$DEST_BUCKET"
export PREFIX="$PREFIX"

# Create audit log
AUDIT_LOG="migration-audit-$(date +%Y%m%d-%H%M%S).log"

echo "=== MIGRATION SCRIPT EXECUTION AUDIT LOG ===" | tee "$AUDIT_LOG"
echo "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')" | tee -a "$AUDIT_LOG"
echo "Script: $SCRIPT_NAME" | tee -a "$AUDIT_LOG"
echo "Environment: $ENVIRONMENT" | tee -a "$AUDIT_LOG"
echo "User: $(whoami)" | tee -a "$AUDIT_LOG"
echo "Host: $(hostname)" | tee -a "$AUDIT_LOG"
echo "Working Directory: $(pwd)" | tee -a "$AUDIT_LOG"
echo "Parameters:" | tee -a "$AUDIT_LOG"
echo "  AWS Account ID: $AWS_ACCOUNT_ID" | tee -a "$AUDIT_LOG"
echo "  Source Bucket: $SOURCE_BUCKET" | tee -a "$AUDIT_LOG"
echo "  Dest Bucket: $DEST_BUCKET" | tee -a "$AUDIT_LOG"
echo "  Prefix: $PREFIX" | tee -a "$AUDIT_LOG"

# Check AWS credentials
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "Error: AWS credentials not configured" | tee -a "$AUDIT_LOG"
    exit 1
fi

echo "AWS Identity: $(aws sts get-caller-identity --query Arn --output text)" | tee -a "$AUDIT_LOG"
echo "=============================================" | tee -a "$AUDIT_LOG"

# Make script executable and run it
chmod +x "$MIGRATION_DIR/$SCRIPT_NAME"

echo "Starting script execution..." | tee -a "$AUDIT_LOG"
cd "$MIGRATION_DIR"

if ./"$SCRIPT_NAME" 2>&1 | tee -a "../$AUDIT_LOG"; then
    echo "Script completed successfully" | tee -a "../$AUDIT_LOG"
    EXIT_CODE=0
else
    EXIT_CODE=$?
    echo "Script failed with exit code: $EXIT_CODE" | tee -a "../$AUDIT_LOG"
fi

echo "=== EXECUTION COMPLETED ===" | tee -a "../$AUDIT_LOG"
echo "Completion time: $(date -u '+%Y-%m-%d %H:%M:%S UTC')" | tee -a "../$AUDIT_LOG"
echo "Audit log saved to: $AUDIT_LOG" | tee -a "../$AUDIT_LOG"

exit $EXIT_CODE