import { checkSecretsSet, retrieveSecretValue } from './retrieveSecretValue'
import { retrieveSsmParameterValue } from './retrieveSsmParameterValues'
import { getOutputValue, retrieveStackOutputs } from './retrieveStackOutputs'

const region = process.env.AWS_REGION ?? 'eu-west-2'
const stack = process.env.STACK_NAME ?? 'txma-ticf-integration'

export async function setup() {
  const secretMappings = {
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
    )
  }

  const stackOutputMappings = {
    ANALYSIS_BUCKET_NAME: 'AnalysisBucketName',
    INITIATE_ATHENA_QUERY_QUEUE_URL: 'InitiateAthenaQueryQueueUrl',
    INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME:
      'InitiateAthenaQueryLambdaLogGroupName',
    INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME:
      'InitiateDataRequestLambdaLogGroupName',
    PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME:
      'ProcessDataRequestLambdaLogGroupName',
    DATA_READY_FOR_QUERY_LAMBDA_LOG_GROUP_NAME:
      'DataReadyForQueryLogsLambdaLogGroupName',
    ZENDESK_WEBHOOK_API_BASE_URL: 'ZendeskWebhookApiUrl'
  }

  const globals = [
    'AWS_REGION',
    'ZENDESK_ADMIN_EMAIL',
    'ZENDESK_AGENT_EMAIL',
    'ZENDESK_END_USER_EMAIL',
    'ZENDESK_END_USER_NAME',
    'ZENDESK_RECIPIENT_NAME'
  ]

  await setEnvVarsFromSecretsManager(secretMappings)
  await setEnvVarsFromSsm(ssmMappings)
  await setEnvVarsFromStackOutputs(stack, stackOutputMappings)
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

const setEnvVarsFromStackOutputs = async (
  stack: string,
  stackOutputMappings: Record<string, string>
) => {
  const stackOutputs = await retrieveStackOutputs(stack, region)

  for (const [k, v] of Object.entries(stackOutputMappings)) {
    process.env[k] = process.env[k]
      ? process.env[k]
      : getOutputValue(stackOutputs, v)
  }
}

const setEnvVarsFromProcessEnv = (vars: string[]) => {
  const defaults: Record<string, string> = {
    ZENDESK_ADMIN_EMAIL: 'txma-team2-ticf-admin-dev@test.gov.uk',
    ZENDESK_AGENT_EMAIL: 'txma-team2-ticf-approver-dev@test.gov.uk',
    ZENDESK_END_USER_EMAIL: 'txma-team2-ticf-analyst-dev@test.gov.uk',
    ZENDESK_END_USER_NAME: 'Txma-team2-ticf-analyst-dev',
    ZENDESK_RECIPIENT_NAME: 'Test User'
  }
  vars.forEach((v) => {
    if (!process.env[v] && defaults[v]) {
      process.env[v] = defaults[v]
    }
  })
}
