/**
 * Invokes a Lambda handler directly in Node.js (no Docker/SAM).
 * Prerequisites: Must be logged in via SSO with the ApprovedServiceSupport role
 * Usage: tsx scripts/debug/invoke-local.ts <lambdaName>
 * e.g. tsx scripts/debug/invoke-local.ts initiateDataRequest
 */
import { readFileSync } from 'fs'
import { execSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Context } from 'aws-lambda'
import {
  STSClient,
  AssumeRoleCommand,
  GetCallerIdentityCommand
} from '@aws-sdk/client-sts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const lambdaName = process.argv[2]
if (!lambdaName) {
  console.error('Usage: invoke-local.ts <lambdaName>')
  process.exit(1)
}

const debugDir = join(__dirname)
const rootDir = join(__dirname, '../..')

const envVars = JSON.parse(
  readFileSync(join(debugDir, 'env-vars.json'), 'utf-8')
) as {
  Parameters: Record<string, string>
}
Object.entries(envVars.Parameters).forEach(([k, v]) => {
  process.env[k] = v
})

process.env.AWS_PROFILE = 'audit-dev-support'

process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'DEBUG'
process.env.POWERTOOLS_DEV = 'true'

// Assume the Lambda execution role
const stackName = process.env.JIRA_TICKET || 'main'

// Map lambda names to their execution role names
const lambdaRoleMap: Record<string, string> = {
  decryptAndCopy: 'decrypt-and-copy-role',
  initiateDataRequest: 'initiate-data-request-role',
  processDataRequest: 'process-data-request-role',
  dataReadyForQuery: 'data-ready-for-query-role',
  initiateAthenaQuery: 'initiate-athena-query-role',
  sendQueryResultsNotification: 'send-query-results-role',
  closeZendeskTicket: 'close-zendesk-ticket-role'
}

const roleBaseName = lambdaRoleMap[lambdaName]
if (!roleBaseName) {
  console.warn(
    `==> Unknown lambda function: ${lambdaName}, using default role naming`
  )
}

const stsClient = new STSClient({ region: 'eu-west-2' })

// First, get current identity to check if we have admin access
let currentIdentity
try {
  const identityCommand = await stsClient.send(new GetCallerIdentityCommand({}))
  currentIdentity = identityCommand
  console.log(`==> Current identity: ${identityCommand.Arn}`)
} catch (identityError) {
  console.error('==> Could not get current identity:', identityError)
  process.exit(1)
}

const accountId = currentIdentity.Account!
const lambdaRoleName = roleBaseName
  ? `${stackName}-${roleBaseName}`
  : `${stackName}-${lambdaName}-role`
const lambdaRoleArn = `arn:aws:iam::${accountId}:role/${lambdaRoleName}`
const debugRoleArn = `arn:aws:iam::${accountId}:role/runbooks/lambda-debugger-role`

console.log(`==> Attempting to assume Lambda execution role: ${lambdaRoleArn}`)

if (!currentIdentity.Arn?.includes('ApprovedServiceSupport')) {
  console.log(
    '==> Not logged in with ApprovedServiceSupport role, running aws sso login...'
  )
  execSync('aws sso login --profile audit-dev-support', { stdio: 'inherit' })
}

try {
  // First assume the debug role
  console.log(`==> Assuming debug role: ${debugRoleArn}`)
  const assumeDebugRoleCommand = new AssumeRoleCommand({
    RoleArn: debugRoleArn,
    RoleSessionName: `debug-session-${Date.now()}`
  })

  const debugRoleResponse = await stsClient.send(assumeDebugRoleCommand)

  if (debugRoleResponse.Credentials) {
    // Update STS client to use debug role credentials
    const debugStsClient = new STSClient({
      region: 'eu-west-2',
      credentials: {
        accessKeyId: debugRoleResponse.Credentials.AccessKeyId!,
        secretAccessKey: debugRoleResponse.Credentials.SecretAccessKey!,
        sessionToken: debugRoleResponse.Credentials.SessionToken!
      }
    })

    console.log('==> Successfully assumed debug role')
    console.log(
      `==> Debug role identity: ${debugRoleResponse.AssumedRoleUser?.Arn}`
    )

    // Now assume the Lambda execution role using debug role credentials
    console.log(`==> Assuming Lambda execution role: ${lambdaRoleArn}`)
    const assumeLambdaRoleCommand = new AssumeRoleCommand({
      RoleArn: lambdaRoleArn,
      RoleSessionName: `debug-${lambdaName}-${Date.now()}`
    })

    const lambdaRoleResponse = await debugStsClient.send(
      assumeLambdaRoleCommand
    )

    if (lambdaRoleResponse.Credentials) {
      // Set the Lambda role credentials as environment variables
      process.env.AWS_ACCESS_KEY_ID = lambdaRoleResponse.Credentials.AccessKeyId
      process.env.AWS_SECRET_ACCESS_KEY =
        lambdaRoleResponse.Credentials.SecretAccessKey
      process.env.AWS_SESSION_TOKEN =
        lambdaRoleResponse.Credentials.SessionToken
      delete process.env.AWS_PROFILE

      console.log('==> Successfully assumed Lambda execution role')
      console.log(
        `==> Lambda role identity: ${lambdaRoleResponse.AssumedRoleUser?.Arn}`
      )
    }
  }
} catch (debugRoleError) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  console.error('==> Failed to assume debug role:', debugRoleError.message)
  console.error(
    '==> Make sure you have run: ./scripts/debug/setup/setup-debug-role.sh'
  )
  process.exit(1)
}

const event = JSON.parse(
  readFileSync(join(debugDir, 'events', `${lambdaName}.json`), 'utf-8')
) as unknown

const context: Context = {
  functionName: lambdaName,
  functionVersion: '$LATEST',
  invokedFunctionArn: `arn:aws:lambda:eu-west-2:${accountId}:function:${lambdaName}`,
  memoryLimitInMB: '1536',
  awsRequestId: 'local-debug-request-id',
  logGroupName: `/aws/lambda/${lambdaName}`,
  logStreamName: 'local',
  getRemainingTimeInMillis: () => 30000,
  callbackWaitsForEmptyEventLoop: false
} as Context

// Dynamic import for ESM compatibility
const handlerPath = join(rootDir, 'src/lambdas', lambdaName, 'handler.js')
const { handler } = (await import(handlerPath)) as {
  handler: (event: unknown, context: Context) => Promise<void>
}

handler(event, context)
  .then(() => console.log('Handler completed successfully'))
  .catch((err: Error) => {
    console.error('Handler failed:', err)
    process.exit(1)
  })
