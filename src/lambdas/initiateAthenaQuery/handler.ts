import { Context, SQSEvent } from 'aws-lambda'
import {
  appendZendeskIdToLogger,
  initialiseLogger,
  logger
} from '../../sharedServices/logger'
import { publishToSNS } from '../../sharedServices/sns/publishToSNS'
import { getEnv } from '../../utils/helpers'
import { initiateQuery } from './initiateQuery'

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<void> => {
  initialiseLogger(context)

  const zendeskId = retrieveZendeskIdFromEvent(event)
  appendZendeskIdToLogger(zendeskId)

  if (zendeskId.startsWith('MR')) {
    logger.info('Manual query detected, no need to run athena query')
    await publishToSNS(
      getEnv('EMAIL_TO_SLACK_SNS_TOPIC_ARN'),
      `Retrieved data for zendeskID: ${zendeskId}`
    )
  } else {
    await initiateQuery(zendeskId)
  }
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
