import { copyAuditDataFromTestDataBucket } from '../../shared-test-code/utils/aws/s3CopyAuditDataFromTestDataBucket'
import { deleteAuditDataWithPrefix } from '../../shared-test-code/utils/aws/s3DeleteAuditDataWithPrefix'
import { s3WaitForFilePrefix } from '../../shared-test-code/utils/aws/s3WaitForFilePrefix'
import { sendWebhookRequest } from '../../shared-test-code/utils/zendesk/sendWebhookRequest'
import { getEnv } from '../../shared-test-code/utils/helpers'
import { getWebhookRequestDataForTestCaseNumberAndDate } from '../utils/getWebhookRequestDataForTestCaseNumberAndDate'
import { pollNotifyMockForDownloadUrl } from '../../shared-test-code/utils/queryResults/getDownloadUrlFromNotifyMock'
import { downloadResultsFileAndParseData } from '../../shared-test-code/utils/queryResults/downloadAndParseResults'

describe('Decryption of data before query', () => {
  const setupEncryptedData = async () => {
    await deleteAuditDataWithPrefix(
      getEnv('ANALYSIS_BUCKET_NAME'),
      `firehose/2022/05/01/01`
    )
    const testDataFileName = 'encryptionPlainTextData.txt.gz'
    const destinationPrefix = `firehose/2022/05/01/01/`
    await copyAuditDataFromTestDataBucket(
      'audit-dev-temporary-message-batch',
      `${destinationPrefix}${testDataFileName}`,
      testDataFileName
    )

    await s3WaitForFilePrefix(
      'audit-dev-permanent-message-batch',
      destinationPrefix
    )
  }
  beforeAll(async () => {
    await setupEncryptedData()
  })

  it('Should be able to query data that arose from an encrypted data store', async () => {
    const webhookRequest = getWebhookRequestDataForTestCaseNumberAndDate(
      3,
      '2022-05-01'
    )
    sendWebhookRequest(webhookRequest)
    const downloadUrl = await pollNotifyMockForDownloadUrl(
      webhookRequest.zendeskId
    )
    expect(downloadUrl.startsWith('https')).toBe(true)
    const csvRows = await downloadResultsFileAndParseData(downloadUrl)
    console.log('Got data ', csvRows)
    expect(csvRows.length).toEqual(1)
    expect(csvRows[0].drivers_license).toEqual(
      '[{"expirydate":"2024-06-19","issuenumber":"96","personalnumber":"BINNS902235OW9TF","issuedby":"DVLA","issuedate":"2014-06-20"}]'
    )
  })
})
