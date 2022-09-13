import { CloudFormationCustomResourceDeleteEvent } from 'aws-lambda'

export const defaultCustomResourceDeleteEvent = {
  LogicalResourceId: 'ExampleBucket',
  PhysicalResourceId: 'example-bucket',
  RequestId: '12345',
  RequestType: 'Delete',
  ResourceType: 'AWS::S3::Bucket',
  ResourceProperties: {
    ServiceToken: 'arn:aws:lambda:us-east-2:123456789012:function:my-function:1'
  },
  ResponseURL: '',
  ServiceToken: 'arn:aws:lambda:us-east-2:123456789012:function:my-function:1',
  StackId: 'stack-id'
} as CloudFormationCustomResourceDeleteEvent
