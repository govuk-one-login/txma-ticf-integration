import { checkSecretsSet, retrieveSecretValue } from './retrieveSecretValue'
import { retrieveSsmParameterValue } from './retrieveSsmParameterValues'
import { getOutputValue, retrieveStackOutputs } from './retrieveStackOutputs'

// eslint-disable-next-line @typescript-eslint/prefer-namespace-keyword, @typescript-eslint/no-namespace
declare module global {
  const AWS_REGION: string
  const STACK_NAME: string
  const ZENDESK_ADMIN_EMAIL: string
  const ZENDESK_AGENT_EMAIL: string
  const ZENDESK_END_USER_EMAIL: string
  const ZENDESK_END_USER_NAME: string
}

module.exports = async () => {
  const region = global.AWS_REGION

  let stack

  if (process.env.STACK_NAME) {
    stack = process.env.STACK_NAME
  } else {
    stack = global.STACK_NAME
  }

  const stackOutputs = await retrieveStackOutputs(stack, region)

  await setZendeskEnvVars('ZendeskSecretSetArn', region)
  await setNotifyEnvVars('IntegrationTestsNotifySecretSetArn', region)

  process.env.ANALYSIS_BUCKET_NAME = getOutputValue(
    stackOutputs,
    'AnalysisBucketName'
  )
  process.env.AUDIT_BUCKET_NAME = await retrieveSsmParameterValue(
    'MessageBatchBucketTXMA2Name',
    region
  )
  process.env.INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME = getOutputValue(
    stackOutputs,
    'InitiateAthenaQueryLambdaLogGroupName'
  )
  process.env.INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME = getOutputValue(
    stackOutputs,
    'InitiateDataRequestLambdaLogGroupName'
  )
  process.env.PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME = getOutputValue(
    stackOutputs,
    'ProcessDataRequestLambdaLogGroupName'
  )
  process.env.TEST_DATA_BUCKET_NAME = await retrieveSsmParameterValue(
    'IntegrationTestDataBucketName',
    region
  )
  process.env.ZENDESK_ADMIN_EMAIL = global.ZENDESK_ADMIN_EMAIL
  process.env.ZENDESK_AGENT_EMAIL = global.ZENDESK_AGENT_EMAIL
  process.env.ZENDESK_END_USER_EMAIL = global.ZENDESK_END_USER_EMAIL
  process.env.ZENDESK_END_USER_NAME = global.ZENDESK_END_USER_NAME
  process.env.ZENDESK_WEBHOOK_API_BASE_URL = getOutputValue(
    stackOutputs,
    'ZendeskWebhookApiUrl'
  )

  if (!process.env.ZENDESK_RECIPIENT_EMAIL) {
    process.env.ZENDESK_RECIPIENT_EMAIL = await retrieveSsmParameterValue(
      'IntegrationTestsRecipientEmail',
      region
    )
  }
}

const setZendeskEnvVars = async (
  zendeskSecretSetArnParameter: string,
  region: string
) => {
  const secretId = await retrieveSsmParameterValue(
    zendeskSecretSetArnParameter,
    region
  )

  const secrets = await retrieveSecretValue(secretId, region)

  checkSecretsSet(secretId, secrets, [
    'ZENDESK_API_KEY',
    'ZENDESK_HOSTNAME',
    'ZENDESK_WEBHOOK_SECRET_KEY'
  ])

  process.env.ZENDESK_API_KEY = secrets['ZENDESK_API_KEY']
  process.env.ZENDESK_BASE_URL = `https://${secrets['ZENDESK_HOSTNAME']}`

  if (!process.env.ZENDESK_WEBHOOK_SECRET_KEY) {
    process.env.ZENDESK_WEBHOOK_SECRET_KEY =
      secrets['ZENDESK_WEBHOOK_SECRET_KEY']
  }
}

const setNotifyEnvVars = async (
  zendeskSecretSetArnParameter: string,
  region: string
) => {
  const secretId = await retrieveSsmParameterValue(
    zendeskSecretSetArnParameter,
    region
  )
  const secrets = await retrieveSecretValue(secretId, region)

  checkSecretsSet(secretId, secrets, ['NOTIFY_API_KEY'])

  process.env.NOTIFY_API_KEY = secrets['NOTIFY_API_KEY']
}
