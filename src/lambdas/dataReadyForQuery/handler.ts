import { S3Tag } from '@aws-sdk/client-s3-control'
import { Context, EventBridgeEvent } from 'aws-lambda'
import { batchJobConstants } from '../../constants/batchJobConstants'
import { getS3BatchJobTags } from '../../sharedServices/bulkJobs/getS3BatchJobTags'
import { initialiseLogger, logger } from '../../sharedServices/logger'
import { sendInitiateAthenaQueryMessage } from '../../sharedServices/queue/sendInitiateAthenaQueryMessage'
import { BatchJobStatusChangeEventDetail } from '../../types/batchJobStatusChangeEventDetail'

export const handler = async (
  event: EventBridgeEvent<
    'Batch Job State Change',
    BatchJobStatusChangeEventDetail
  >,
  context: Context
) => {
  initialiseLogger(context)
  logger.info('received event', { handledEvent: event })
  const statusIsOfInterest = ['Complete', 'Failed'].includes(
    event.detail.status
  )
  if (!statusIsOfInterest) {
    logger.info(`Status ${event.detail.status} is not relevant. Exiting.`)
    return
  }

  const batchJobTags = await getS3BatchJobTags(event.detail.jobId)
  logger.info('Got batch job tags', { batchJobTags: batchJobTags })
  if (!batchJobIsTransferToAnalysisBucket(batchJobTags)) {
    logger.info('Batch job is not transfer to analysis bucket. Exiting')
    return
  }

  const zendeskId = getZendeskIdFromTags(batchJobTags)
  if (event.detail.status === 'Complete') {
    logger.info('Batch job complete')
    await sendInitiateAthenaQueryMessage(zendeskId)
  } else {
    logger.info(`Batch job status is ${event.detail.status}`)
  }
}

const getZendeskIdFromTags = (tags: S3Tag[] | undefined): string => {
  const zendeskId = tags?.find(
    (t) => t.Key === batchJobConstants.zendeskIdTagName
  )

  if (!zendeskId || !zendeskId.Value) {
    throw new Error('Could not find ZendeskId in tag collection')
  }

  return zendeskId.Value
}
const batchJobIsTransferToAnalysisBucket = (
  tags: S3Tag[] | undefined
): boolean =>
  batchJobTagsContainsKey(
    tags,
    batchJobConstants.transferToAnalysisBucketJobTagName
  ) && batchJobTagsContainsKey(tags, batchJobConstants.zendeskIdTagName)

const batchJobTagsContainsKey = (
  tags: S3Tag[] | undefined,
  key: string
): boolean => !!tags?.some((t) => t.Key === key)
