import {
  GetJobTaggingCommand,
  GetJobTaggingCommandOutput,
  S3ControlClient
} from '@aws-sdk/client-s3-control'
import { getS3BatchJobTags } from './getS3BatchJobTags'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'
import { TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID } from '../../utils/tests/testConstants'
const s3ControlClientMock = mockClient(S3ControlClient)

describe('getS3BatchJobTags', () => {
  const key1 = 'myKey1'
  const value1 = 'myValue1'
  const key2 = 'myKey2'
  const value2 = 'myValue2'
  const givenTags = [
    {
      Key: key1,
      Value: value1
    },
    {
      Key: key2,
      Value: value2
    }
  ]
  s3ControlClientMock.on(GetJobTaggingCommand).resolves({
    Tags: givenTags
  } as GetJobTaggingCommandOutput)
  it('should retrieve any batch job tags that exist', async () => {
    const result = await getS3BatchJobTags(
      TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID
    )
    expect(result).toEqual(givenTags)
  })
})
