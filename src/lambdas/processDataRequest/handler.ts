import { Context, SQSEvent } from 'aws-lambda'
import { initiateDataTransfer } from './initiateDataTransfer'
import { tryParseJSON, isEmpty } from '../../../common/utils/helpers'
import { isDataRequestParams } from '../../../common/types/dataRequestParams'
import { isContinueDataTransferParams } from '../../../common/types/continueDataTransferParams'
import { checkDataTransferStatus } from './checkDataTransferStatus'
import {
  appendZendeskIdToLogger,
  initialiseLogger,
  logger
} from '../../../common/sharedServices/logger'

export const handler = async (event: SQSEvent, context: Context) => {
  initialiseLogger(context)
  const startTime = Date.now()
  const correlationId = event.Records[0]?.messageId

  logger.info('Process data request started', {
    correlationId,
    recordCount: event.Records.length
  })

  if (event.Records.length === 0) {
    throw new Error('No data in event')
  }
  const eventData = tryParseJSON(event.Records[0].body)
  if (isEmpty(eventData)) {
    throw new Error('Event data did not include a valid JSON body')
  }
  appendZendeskIdToLogger(eventData.zendeskId)

  if (isDataRequestParams(eventData)) {
    await initiateDataTransfer(eventData)
    logger.info('Data transfer process initiated')
    logger.info('Process data request completed', {
      correlationId,
      outcome: 'success',
      duration: Date.now() - startTime,
      action: 'initiateDataTransfer'
    })
  } else if (isContinueDataTransferParams(eventData)) {
    const params = eventData
    await checkDataTransferStatus(params.zendeskId)
    logger.info('Process data request completed', {
      correlationId,
      outcome: 'success',
      duration: Date.now() - startTime,
      action: 'checkDataTransferStatus'
    })
  } else {
    throw new Error('Event data was not of the correct type')
  }

  return {}
}
