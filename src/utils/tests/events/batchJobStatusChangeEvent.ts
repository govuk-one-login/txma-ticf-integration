import { EventBridgeEvent } from 'aws-lambda'
import { BatchJobStatusChangeEventDetail } from '../../../types/batchJobStatusChangeEventDetail'
import { TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID } from '../testConstants'

export const batchJobStatusChangeEvent = (
  status: string
): EventBridgeEvent<
  'AWS Service Event via CloudTrail',
  BatchJobStatusChangeEventDetail
> => ({
  version: '0',
  id: '398e9664-0909-3903-225e-086f7683a9b9',
  'detail-type': 'AWS Service Event via CloudTrail',
  source: 'aws.s3',
  account: '725018305812',
  time: '2023-02-23T10:07:01Z',
  region: 'eu-west-2',
  resources: [],
  detail: {
    serviceEventDetails: {
      jobId: TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID,
      status
    }
  }
})
