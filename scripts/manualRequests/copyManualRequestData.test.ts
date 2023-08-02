import { copyS3Object } from '../../src/sharedServices/s3/copyS3Object'
import { getBucketFileName } from './getBucketFileName'
import { copyManualRequestData } from './copyManualRequestData'
import { getEnv } from '../../src/utils/helpers'

const TEST_ATHENA_QUERY_ID = '46e34211-f930-4e15-a9fb-802f2ae77052'

jest.mock('../../src/sharedServices/s3/copyS3Object', () => ({
  copyS3Object: jest.fn()
}))

describe('copyManualRequestData function tests', () => {
  it('copies manual request data based on an Athena query ID', async () => {
    const fileName = getBucketFileName(TEST_ATHENA_QUERY_ID)
    const outputBucketName = getEnv('ANALYSIS_BUCKET_NAME')
    const sourcePath = `${outputBucketName}/manual-audit-data-queries`
    const destinationBucket = `${outputBucketName}`
    await copyManualRequestData(TEST_ATHENA_QUERY_ID)
    expect(copyS3Object).toHaveBeenCalledWith(
      fileName,
      sourcePath,
      destinationBucket
    )
  })
})
