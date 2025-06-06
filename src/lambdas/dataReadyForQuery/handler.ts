import { S3Tag } from '@aws-sdk/client-s3-control'
import { Context, EventBridgeEvent } from 'aws-lambda'
import { batchJobConstants } from '../../../common/constants/batchJobConstants'
import { getS3BatchJobTags } from '../../../common/sharedServices/bulkJobs/getS3BatchJobTags'
import {
  appendZendeskIdToLogger,
  initialiseLogger,
  logger
} from '../../../common/sharedServices/logger'
import { sendInitiateAthenaQueryMessage } from '../../../common/sharedServices/queue/sendInitiateAthenaQueryMessage'
import { updateZendeskTicketById } from '../../../common/sharedServices/zendesk/updateZendeskTicket'
import { BatchJobStatusChangeEventDetail } from '../../../common/types/batchJobStatusChangeEventDetail'
import { jobWasSuccessful } from './jobWasSuccessful'

export const handler = async (
  event: EventBridgeEvent<
    'AWS Service Event via CloudTrail',
    BatchJobStatusChangeEventDetail
  >,
  context: Context
) => {
  initialiseLogger(context)
  const eventStatus = event.detail.serviceEventDetails.status
  const jobId = event.detail.serviceEventDetails.jobId

  logger.info('Received batch job status change event', {
    jobId,
    eventStatus
  })

  const statusIsOfInterest = ['Complete', 'Failed'].includes(eventStatus)
  if (!statusIsOfInterest) {
    return
  }

  const batchJobTags = await getS3BatchJobTags(jobId)
  logger.info('Successfully fetched batchJobTags', { jobId, batchJobTags })
  if (!batchJobIsTransferToAnalysisBucket(batchJobTags)) {
    return
  }

  const zendeskId = getZendeskIdFromTags(batchJobTags)
  appendZendeskIdToLogger(zendeskId)
  if (await jobWasSuccessful(jobId, eventStatus)) {
    logger.info('Transfer to analysis bucket job was successful', { jobId })
    await sendInitiateAthenaQueryMessage(zendeskId)
  } else {
    logger.error(
      'Transfer to analysis bucket job failed for jobID. Please check the job report and lambda logs for details of what went wrong',
      { jobId }
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

  if (!zendeskId?.Value) {
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
