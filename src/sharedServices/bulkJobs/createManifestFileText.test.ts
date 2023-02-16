import { TEST_AUDIT_BUCKET } from '../../utils/tests/testConstants'
import { createManifestFileText } from './createManifestFileText'
const file1Key = 'myFileKey1'
const file2Key = 'myFileKey2'
describe('createManifestFileText', () => {
  it('should create a single-line file when there is only file in the manifest', () => {
    const result = createManifestFileText(TEST_AUDIT_BUCKET, [file1Key])
    expect(result).toEqual(`${TEST_AUDIT_BUCKET},${file1Key}`)
  })

  it('should create a multi-line file when there is only file in the manifest', () => {
    const result = createManifestFileText(TEST_AUDIT_BUCKET, [
      file1Key,
      file2Key
    ])
    expect(result).toEqual(
      `${TEST_AUDIT_BUCKET},${file1Key}\r\n${TEST_AUDIT_BUCKET},${file2Key}`
    )
  })
})
