import { checkSecretsSet, retrieveSecretValue } from './retrieveSecretValue'
import { retrieveSsmParameterValue } from './retrieveSsmParameterValues'

const region = process.env.AWS_REGION ?? 'eu-west-2'
const stack = process.env.STACK_NAME ?? 'txma-ticf-integration'
// In dev, feature stacks do not have seeded per-stack test secrets. The dev
// integration tests only need the Zendesk webhook signing key (which must match
// the deployed app) plus a couple of Zendesk API values; they mock Zendesk and do
// not use Notify. So in dev we read from the shared `ZendeskSecrets` secret that the
// app itself uses (exported as ZendeskSecretSetArn), guaranteeing the signing key
// matches, and skip the e2e-only Notify secret. Build/staging keep the per-stack path.
const isDev = process.env.TEST_ENVIRONMENT === 'dev'

export async function setup() {
  const secretMappings = isDev
    ? {
        ZendeskSecrets: [
          'ZENDESK_API_KEY',
          'ZENDESK_HOSTNAME',
          'ZENDESK_WEBHOOK_SECRET_KEY'
        ]
      }
    : {
        [`tests/${stack}/ZendeskSecrets`]: [
          'ZENDESK_API_KEY',
          'ZENDESK_HOSTNAME',
          'ZENDESK_RECIPIENT_EMAIL',
          'ZENDESK_WEBHOOK_SECRET_KEY'
        ],
        [`tests/${stack}/NotifySecrets`]: ['NOTIFY_API_KEY']
      }

  const formatTestStackSsmParam = (parameterName: string) =>
    `/tests/${stack}/${parameterName}`

  const ssmMappings = {
    AUDIT_BUCKET_NAME: formatTestStackSsmParam('AuditBucketName'),
    PERMANENT_AUDIT_BUCKET_NAME: formatTestStackSsmParam(
      'PermanentAuditBucketName'
    ),
    TEMPORARY_AUDIT_BUCKET_NAME: formatTestStackSsmParam(
      'TemporaryAuditBucketName'
    ),
    AUDIT_REQUEST_DYNAMODB_TABLE: formatTestStackSsmParam(
      'QueryRequestTableName'
    ),
    DYNAMO_OPERATIONS_FUNCTION_NAME: formatTestStackSsmParam(
      'DynamoOperationsFunctionName'
    ),
    SQS_OPERATIONS_FUNCTION_NAME: formatTestStackSsmParam(
      'SqsOperationsFunctionName'
    ),
    TEST_DATA_BUCKET_NAME: formatTestStackSsmParam(
      'IntegrationTestDataBucketName'
    ),
    FEATURE_DECRYPT_DATA: formatTestStackSsmParam('FeatureDecryptData'),
    ATHENA_OUTPUT_BUCKET_NAME: formatTestStackSsmParam(
      'IntegrationTestsAthenaOutputBucketName'
    ),
    S3_READ_FILE_FUNCTION_NAME: formatTestStackSsmParam(
      'ReadS3FileToStringFunctionName'
    ),
    CHECK_S3_FILE_EXISTS_FUNCTION_NAME: formatTestStackSsmParam(
      'CheckS3FileExistsFunctionName'
    ),
    S3_OPERATIONS_FUNCTION_NAME: formatTestStackSsmParam(
      'S3OperationsFunctionName'
    ),
    // Read from SSM instead of CloudFormation stack outputs, because the dev
    // permissions boundary does not allow cloudformation:DescribeStacks. These params
    // are published by the template (mirroring the same-named Outputs).
    ANALYSIS_BUCKET_NAME: formatTestStackSsmParam('AnalysisBucketName'),
    INITIATE_ATHENA_QUERY_QUEUE_URL: formatTestStackSsmParam(
      'InitiateAthenaQueryQueueUrl'
    ),
    INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME: formatTestStackSsmParam(
      'InitiateAthenaQueryLambdaLogGroupName'
    ),
    INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME: formatTestStackSsmParam(
      'InitiateDataRequestLambdaLogGroupName'
    ),
    PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME: formatTestStackSsmParam(
      'ProcessDataRequestLambdaLogGroupName'
    ),
    DATA_READY_FOR_QUERY_LAMBDA_LOG_GROUP_NAME: formatTestStackSsmParam(
      'DataReadyForQueryLogsLambdaLogGroupName'
    ),
    ZENDESK_WEBHOOK_API_BASE_URL: formatTestStackSsmParam(
      'ZendeskWebhookApiUrl'
    )
  }

  const globals = [
    'AWS_REGION',
    'ZENDESK_ADMIN_EMAIL',
    'ZENDESK_AGENT_EMAIL',
    'ZENDESK_END_USER_EMAIL',
    'ZENDESK_END_USER_NAME',
    'ZENDESK_RECIPIENT_NAME',
    // In dev the Zendesk recipient email is not in the shared secret; supply the
    // mock value used by the integration tests. Build/staging read it from the secret.
    ...(isDev ? ['ZENDESK_RECIPIENT_EMAIL'] : [])
  ]

  await setEnvVarsFromSecretsManager(secretMappings)
  await setEnvVarsFromSsm(ssmMappings)
  setEnvVarsFromProcessEnv(globals)
}

const setEnvVarsFromSecretsManager = async (
  secretMappings: Record<string, string[]>
) => {
  for (const [secretSet, secrets] of Object.entries(secretMappings)) {
    const secretValues = await retrieveSecretValue(secretSet, region)
    checkSecretsSet(secretSet, secretValues, secrets)

    secrets.forEach(
      (secret) =>
        (process.env[secret] = process.env[secret]
          ? process.env[secret]
          : secretValues[secret])
    )
  }
}

const setEnvVarsFromSsm = async (ssmMappings: Record<string, string>) => {
  for (const [k, v] of Object.entries(ssmMappings)) {
    process.env[k] = process.env[k]
      ? process.env[k]
      : await retrieveSsmParameterValue(v, region)
  }
}

const setEnvVarsFromProcessEnv = (vars: string[]) => {
  const defaults: Record<string, string> = {
    ZENDESK_ADMIN_EMAIL: 'txma-team2-ticf-admin-dev@test.gov.uk',
    ZENDESK_AGENT_EMAIL: 'txma-team2-ticf-approver-dev@test.gov.uk',
    ZENDESK_END_USER_EMAIL: 'txma-team2-ticf-analyst-dev@test.gov.uk',
    ZENDESK_END_USER_NAME: 'Txma-team2-ticf-analyst-dev',
    ZENDESK_RECIPIENT_NAME: 'Test User',
    ZENDESK_RECIPIENT_EMAIL: 'fake-ticf-recipient@test.gov.uk'
  }
  vars.forEach((v) => {
    if (!process.env[v] && defaults[v]) {
      process.env[v] = defaults[v]
    }
  })
}
