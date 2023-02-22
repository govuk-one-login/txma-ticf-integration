import { Context, EventBridgeEvent } from 'aws-lambda'
import { initialiseLogger, logger } from '../../sharedServices/logger'
import { BatchJobStatusChangeEventDetail } from '../../types/batchJobStatusChangeEventDetail'

export const handler = (
  event: EventBridgeEvent<
    'Batch Job State Change',
    BatchJobStatusChangeEventDetail
  >,
  context: Context
) => {
  initialiseLogger(context)
  logger.info('received event', { handledEvent: event })
}
