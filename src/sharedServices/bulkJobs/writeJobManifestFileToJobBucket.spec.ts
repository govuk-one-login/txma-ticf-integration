import {
  TEST_AUDIT_BUCKET,
  TEST_BATCH_JOB_MANIFEST_BUCKET_NAME
} from '../../utils/tests/testConstants'
import { createManifestFileText } from './createManifestFileText'
import { writeJobManifestFileToJobBucket } from './writeJobManifestFileToJobBucket'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'

jest.mock('./createManifestFileText', () => ({
  createManifestFileText: jest.fn()
}))
const createManifestFileTextMock = createManifestFileText as jest.Mock
const s3ClientMock = mockClient(S3Client)
const testEtag = 'myTestEtag'
const manifestFileContents = 'my,manifest,file,contents'
describe('writeJobManifestFileToJobBucket', () => {
  it('should write the generated manifest file to the manifest bucket, and return the etag of the written file', async () => {
    s3ClientMock.on(PutObjectCommand).resolves({ ETag: testEtag })
    createManifestFileTextMock.mockReturnValue(manifestFileContents)
    const fileList = ['file1', 'file2']
    const manifestFileName = 'myManifestFileName'

    await writeJobManifestFileToJobBucket(
      TEST_AUDIT_BUCKET,
      fileList,
      manifestFileName
    )

    expect(s3ClientMock).toHaveReceivedCommandWith(PutObjectCommand, {
      Body: manifestFileContents,
      Bucket: TEST_BATCH_JOB_MANIFEST_BUCKET_NAME,
      Key: manifestFileName
    })

    expect(createManifestFileTextMock).toHaveBeenCalledWith(
      TEST_AUDIT_BUCKET,
      fileList
    )
  })
})
