import { mockClient } from 'aws-sdk-client-mock'
import { listS3Buckets } from './listS3Buckets'
import {
  CloudFormationClient,
  ListStackResourcesCommand
} from '@aws-sdk/client-cloudformation'

const cloudFormationMock = mockClient(CloudFormationClient)

describe('list s3 buckets', () => {
  const stackId = 'example-stack'

  beforeEach(() => {
    cloudFormationMock.reset()
  })

  test('response has no resources', async () => {
    cloudFormationMock.on(ListStackResourcesCommand).resolves({})

    const result = await listS3Buckets(stackId)
    expect(result).toEqual([])
  })

  test('response has no s3 buckets', async () => {
    cloudFormationMock.on(ListStackResourcesCommand).resolves({
      StackResourceSummaries: [
        {
          LogicalResourceId: 'LambdaFunction',
          PhysicalResourceId: 'example-lambda-function',
          ResourceType: 'AWS::Lambda::Function',
          LastUpdatedTimestamp: '2022-09-06T14:52:21.357Z',
          ResourceStatus: 'CREATE_COMPLETE'
        }
      ]
    })

    const result = await listS3Buckets(stackId)
    expect(result).toEqual([])
  })

  test('response has s3 buckets', async () => {
    cloudFormationMock.on(ListStackResourcesCommand).resolves({
      StackResourceSummaries: [
        {
          LogicalResourceId: 'S3Bucket',
          PhysicalResourceId: 'example-s3-bucket',
          ResourceType: 'AWS::S3::Bucket',
          LastUpdatedTimestamp: '2022-09-06T14:52:21.357Z',
          ResourceStatus: 'CREATE_COMPLETE'
        }
      ]
    })

    const result = await listS3Buckets(stackId)
    expect(result).toEqual(['example-s3-bucket'])
  })
})
