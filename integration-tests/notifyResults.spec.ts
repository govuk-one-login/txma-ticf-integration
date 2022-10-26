import {
  AUDIT_BUCKET_NAME,
  END_TO_END_TEST_DATE_PREFIX,
  END_TO_END_TEST_FILE_NAME
} from './constants/awsParameters'
import { endToEndTestRequestData } from './constants/requestData'
import { retrieveSecureDownloadDbRecord } from './utils/aws/retrieveSecureDownloadDbRecord'
import { copyAuditDataFromTestDataBucket } from './utils/aws/s3CopyAuditDataFromTestDataBucket'
import { deleteAuditDataWithPrefix } from './utils/aws/s3DeleteAuditDataWithPrefix'
import { pause } from './utils/helpers'
import { approveZendeskTicket } from './utils/zendesk/approveZendeskTicket'
import { createZendeskTicket } from './utils/zendesk/createZendeskTicket'

describe('Query results generated', () => {
  jest.setTimeout(60000)

  beforeEach(async () => {
    await deleteAuditDataWithPrefix(
      AUDIT_BUCKET_NAME,
      `firehose/${END_TO_END_TEST_DATE_PREFIX}`
    )

    await copyAuditDataFromTestDataBucket(
      AUDIT_BUCKET_NAME,
      `firehose/${END_TO_END_TEST_DATE_PREFIX}/01/${END_TO_END_TEST_FILE_NAME}`,
      END_TO_END_TEST_FILE_NAME
    )
  })

  it('Fraud Site table should be populated after query completes successfully', async () => {
    const zendeskId: string = await createZendeskTicket(endToEndTestRequestData)
    await approveZendeskTicket(zendeskId)

    let downloadHash = await retrieveSecureDownloadDbRecord(zendeskId)
    const maxAttempts = 30
    let attempts = 0
    while (!downloadHash && attempts < maxAttempts) {
      attempts++
      await pause(2000)
      downloadHash = await retrieveSecureDownloadDbRecord(zendeskId)
    }

    if (attempts == maxAttempts) {
      throw Error(
        'Download hash not populated within reasonable time. Please check logs to ensure that data retrieval and query execution were successful'
      )
    }
    console.log(`DOWNLOAD HASH: ${downloadHash}`)
    expect(downloadHash).toBeDefined()
    // TODO: check csv is valid
  })
})
