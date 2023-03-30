import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import { getEnv } from '../../utils/helpers'

export const publishToSNS = async (topicARN: string, message: string) => {
  const client = new SNSClient({ region: getEnv('AWS_REGION') })
  const command = new PublishCommand({
    Message: message,
    TopicArn: topicARN
  })

  const response = await client.send(command)
  return response.MessageId
}
