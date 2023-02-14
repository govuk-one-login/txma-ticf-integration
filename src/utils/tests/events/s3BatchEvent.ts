import { TEST_PERMANENT_BUCKET_ARN, TEST_S3_OBJECT_KEY } from '../testConstants'

export const testS3BatchEvent = {
  invocationSchemaVersion: '1.0',
  invocationId: '',
  job: {
    id: ''
  },
  tasks: [
    {
      taskId: '',
      s3Key: TEST_S3_OBJECT_KEY,
      s3VersionId: '1',
      s3BucketArn: TEST_PERMANENT_BUCKET_ARN
    }
  ]
}
