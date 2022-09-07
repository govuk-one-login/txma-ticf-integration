import {
  CloudFormationClient,
  ListStackResourcesCommand
} from '@aws-sdk/client-cloudformation'
import { getEnv } from '../utils/helpers'

export const listS3Buckets = async (stackId: string): Promise<string[]> => {
  const client = new CloudFormationClient({ region: getEnv('AWS_REGION') })
  const command = new ListStackResourcesCommand({ StackName: stackId })
  const response = await client.send(command)

  if (!response.StackResourceSummaries) return []

  return response.StackResourceSummaries.map((resource) => {
    if (resource.ResourceType === 'AWS::S3::Bucket') {
      return resource.PhysicalResourceId
    }
  }) as string[]
}
