import { Context, SQSEvent } from 'aws-lambda'
import { initiateDataTransfer } from './initiateDataTransfer'
import { tryParseJSON, isEmpty } from '../../utils/helpers'
import { isDataRequestParams } from '../../types/dataRequestParams'
import { isContinueDataTransferParams } from '../../types/continueDataTransferParams'
import { checkDataTransferStatus } from './checkDataTransferStatus'
import {
  appendZendeskIdToLogger,
  initialiseLogger,
  logger
} from '../../sharedServices/logger'

export const handler = async (event: SQSEvent, context: Context) => {
  initialiseLogger(context)
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
  } else if (isContinueDataTransferParams(eventData)) {
    const params = eventData
    await checkDataTransferStatus(params.zendeskId)
  } else {
    throw new Error('Event data was not of the correct type')
  }

  return {}
}
