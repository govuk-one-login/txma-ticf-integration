import { copyS3Object } from '../../src/sharedServices/s3/copyS3Object'
import { getBucketFileName } from './getBucketFileName'
import { copyManualRequestData } from './copyManualRequestData'

const TEST_ATHENA_QUERY_ID = '46e34211-f930-4e15-a9fb-802f2ae77052'

jest.mock('../../src/sharedServices/s3/copyS3Object', () => ({
  copyS3Object: jest.fn()
}))

describe('copyManualRequestData function tests', () => {
  it('copies manual request data based on an Athena query ID', async () => {
    const environment = 'test'
    const fileName = `ticf-automated-audit-data-queries/${getBucketFileName(
      TEST_ATHENA_QUERY_ID
    )}`
    const outputBucketName = `txma-data-analysis-${environment}-athena-query-output-bucket`
    const sourcePath = `${outputBucketName}/manual-audit-data-queries/${getBucketFileName(
      TEST_ATHENA_QUERY_ID
    )}`
    await copyManualRequestData(environment, TEST_ATHENA_QUERY_ID)
    expect(copyS3Object).toHaveBeenCalledWith(
      fileName,
      sourcePath,
      outputBucketName
    )
  })
})
