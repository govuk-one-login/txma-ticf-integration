import { setupAuditSourceTestData } from '../../shared-test-code/utils/aws/setupAuditSourceTestData'
import { sendWebhookRequest } from '../../shared-test-code/utils/zendesk/sendWebhookRequest'
import { getWebhookRequestDataForTestCaseNumberAndDate } from '../utils/getWebhookRequestDataForTestCaseNumberAndDate'
import { pollNotifyMockForDownloadUrl } from '../../shared-test-code/utils/queryResults/getDownloadUrlFromNotifyMock'
import { downloadResultsFileAndParseData } from '../../shared-test-code/utils/queryResults/downloadAndParseResults'
import { deleteAuditDataWithPrefix } from '../../shared-test-code/utils/aws/s3DeleteAuditDataWithPrefix'
import { getEnv } from '../../shared-test-code/utils/helpers'

describe('Data flows from audit bucket to output', () => {
  beforeAll(async () => {
    const s3Prefix = 'firehose/2022/05/01/01'
    await deleteAuditDataWithPrefix(getEnv('ANALYSIS_BUCKET_NAME'), s3Prefix)
    await setupAuditSourceTestData('encryptionPlainTextData.txt.gz', s3Prefix)
  })

  it('Should be able to query data that arose from either an encrypted or plain text data store', async () => {
    const webhookRequest = getWebhookRequestDataForTestCaseNumberAndDate(
      3,
      '2022-05-01'
    )
    console.log('test ticketId:', webhookRequest.zendeskId)
    sendWebhookRequest(webhookRequest)
    const downloadUrl = await pollNotifyMockForDownloadUrl(
      webhookRequest.zendeskId
    )
    expect(downloadUrl.startsWith('https')).toBe(true)
    const csvRows = await downloadResultsFileAndParseData(downloadUrl)
    expect(csvRows.length).toEqual(1)
    expect(csvRows[0].drivers_license).toEqual(
      '[{"expirydate":"2024-06-19","issuenumber":"96","personalnumber":"BINNS902235OW9TF","issuedby":"DVLA","issuedate":"2014-06-20"}]'
    )
  })
})
