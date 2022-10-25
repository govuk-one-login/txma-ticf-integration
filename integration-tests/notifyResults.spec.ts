import {
  AUDIT_BUCKET_NAME,
  END_TO_END_TEST_DATE_PREFIX,
  END_TO_END_TEST_FILE_NAME
} from './constants/awsParameters'
import { copyAuditDataFromTestDataBucket } from './utils/aws/s3CopyAuditDataFromTestDataBucket'

describe('Query results generated', () => {
  it('Fraud Site table should be populated after query completes successfully', async () => {
    // TODO: Ensure test file has matchable dates, timestamps, and identifier
    // TODO: copy data into audit bucket
    // TODO: create with matching date, data path/pii type, and id. Approve ticket
    // TODO: Scan table for entry with zendesk id
    // TODO (stretch): check csv is valid

    await copyAuditDataFromTestDataBucket(
      AUDIT_BUCKET_NAME,
      `firehose/${END_TO_END_TEST_DATE_PREFIX}/01/${END_TO_END_TEST_FILE_NAME}`,
      END_TO_END_TEST_FILE_NAME
    )
  })
})
