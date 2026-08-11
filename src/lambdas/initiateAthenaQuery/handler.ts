import { Context, SQSEvent } from 'aws-lambda'
import {
  appendZendeskIdToLogger,
  initialiseLogger,
  logger
} from '../../../common/sharedServices/logger'
import { initiateQuery } from './initiateQuery'

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<void> => {
  initialiseLogger(context)
  const startTime = Date.now()
  const correlationId = event.Records[0]?.messageId

  const zendeskId = retrieveZendeskIdFromEvent(event)
  appendZendeskIdToLogger(zendeskId)

  logger.info('Initiate Athena query started', {
    correlationId,
    isManualRequest: zendeskId.startsWith('MR')
  })

  if (zendeskId.startsWith('MR')) {
    logger.info('Manual query detected, no need to run Athena query')
  } else {
    logger.info('Automated query detected, running Athena query')
    await initiateQuery(zendeskId)
  }

  logger.info('Initiate Athena query completed', {
    correlationId,
    outcome: 'success',
    duration: Date.now() - startTime
  })
}

export const retrieveZendeskIdFromEvent = (event: SQSEvent): string => {
  if (event.Records.length < 1) {
    throw new Error('No data in Athena Query event')
  }

  const zendeskId = event.Records[0].body
  if (zendeskId.length < 1) {
    throw new Error('No zendeskId received from SQS')
  }

  return zendeskId
}
