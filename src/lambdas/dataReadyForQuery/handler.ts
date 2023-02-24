import { S3Tag } from '@aws-sdk/client-s3-control'
import { Context, EventBridgeEvent } from 'aws-lambda'
import { batchJobConstants } from '../../constants/batchJobConstants'
import { getS3BatchJobTags } from '../../sharedServices/bulkJobs/getS3BatchJobTags'
import {
  appendZendeskIdToLogger,
  initialiseLogger,
  logger
} from '../../sharedServices/logger'
import { sendInitiateAthenaQueryMessage } from '../../sharedServices/queue/sendInitiateAthenaQueryMessage'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { BatchJobStatusChangeEventDetail } from '../../types/batchJobStatusChangeEventDetail'
import { jobWasSuccessful } from './jobWasSuccessful'

export const handler = async (
  event: EventBridgeEvent<
    'AWS Service Event via CloudTrail',
    BatchJobStatusChangeEventDetail
  >,
  context: Context
) => {
  initialiseLogger(context)
  logger.info('received event', { handledEvent: event })
  const eventStatus = event.detail.serviceEventDetails.status
  const jobId = event.detail.serviceEventDetails.jobId

  const statusIsOfInterest = ['Complete', 'Failed'].includes(eventStatus)
  if (!statusIsOfInterest) {
    logger.info(`Status ${eventStatus} is not relevant. Exiting.`)
    return
  }

  const batchJobTags = await getS3BatchJobTags(jobId)
  logger.info('Got batch job tags', { batchJobTags: batchJobTags })
  if (!batchJobIsTransferToAnalysisBucket(batchJobTags)) {
    logger.info('Batch job is not transfer to analysis bucket. Exiting')
    return
  }

  const zendeskId = getZendeskIdFromTags(batchJobTags)
  appendZendeskIdToLogger(zendeskId)
  if (await jobWasSuccessful(jobId, eventStatus)) {
    logger.info('Batch job was successful. Queueing Athena query...')
    await sendInitiateAthenaQueryMessage(zendeskId)
  } else {
    logger.error(
      `Transfer to analysis bucket job failed for zendesk ID '${zendeskId}', jobID '${jobId}'. Please check the job report and lambda logs for details of what went wrong`
    )
    closeTicketOnFailure(zendeskId)
  }
}

const closeTicketOnFailure = async (zendeskId: string) => {
  await updateZendeskTicketById(
    zendeskId,
    'The data retrieval process errored and the data could not be retrieved. Please try again by opening another ticket, or contact the TxMA team to look into it for you',
    'closed'
  )
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
