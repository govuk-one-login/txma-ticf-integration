import {
  AUDIT_BUCKET_NAME,
  END_TO_END_TEST_DATE_PREFIX,
  END_TO_END_TEST_FILE_NAME
} from './constants/awsParameters'
import { endToEndTestRequestData } from './constants/requestData'
import { copyAuditDataFromTestDataBucket } from './utils/aws/s3CopyAuditDataFromTestDataBucket'
import { approveZendeskTicket } from './utils/zendesk/approveZendeskTicket'
import { createZendeskTicket } from './utils/zendesk/createZendeskTicket'

describe('Query results generated', () => {
  // TODO: Ensure test file has matchable dates, timestamps, and identifier. Done
  // TODO: copy data into audit bucket. Done
  // TODO: create ticket with matching date, data path/pii type, and id. Approve ticket. Done
  // TODO: Scan table for entry with zendesk id
  // TODO (stretch): check csv is valid
  beforeEach(async () => {
    await copyAuditDataFromTestDataBucket(
      AUDIT_BUCKET_NAME,
      `firehose/${END_TO_END_TEST_DATE_PREFIX}/01/${END_TO_END_TEST_FILE_NAME}`,
      END_TO_END_TEST_FILE_NAME
    )
  })

  it('Fraud Site table should be populated after query completes successfully', async () => {
    const zendeskId: string = await createZendeskTicket(endToEndTestRequestData)
    await approveZendeskTicket(zendeskId)

    const hashPopulated = false
    console.log(hashPopulated)
  })
})
