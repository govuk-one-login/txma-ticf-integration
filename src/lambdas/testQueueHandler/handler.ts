import { Context, SQSEvent } from 'aws-lambda'
import { getEnv } from '../../utils/helpers'
import { initialiseLogger, logger } from '../../sharedServices/logger'

export const handler = async (event: SQSEvent, context: Context) => {
  initialiseLogger(context)
  logger.info('Handling test SQS event', {
    handledEvent: event
  })
  if (getEnv('SHOULD_ERROR') === 'true') {
    throw Error('Something went wrong: ARRRRGH!')
  }
}
