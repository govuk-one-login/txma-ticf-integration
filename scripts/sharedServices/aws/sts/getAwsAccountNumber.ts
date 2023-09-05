import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts'
import { AWS_REGION } from '../../../utils/constants'

export const getAwsAccountNumber = async () => {
  const stsClient = new STSClient({ region: AWS_REGION })
  const getCallerIdentityCommand = new GetCallerIdentityCommand({})

  const data = await stsClient.send(getCallerIdentityCommand)

  return data.Account
}
