import { Context, SQSEvent } from 'aws-lambda'
import { initiateDataTransfer } from './initiateDataTransfer'
import { tryParseJSON, isEmpty } from '../../utils/helpers'
import {
  DataRequestParams,
  isDataRequestParams
} from '../../types/dataRequestParams'
import {
  ContinueDataTransferParams,
  isContinueDataTransferParams
} from '../../types/continueDataTransferParams'
import { checkDataTransferStatus } from './checkDataTransferStatus'
import { logger } from '../../sharedServices/logger'

export const handler = async (event: SQSEvent, context: Context) => {
  logger.addContext(context)
  logger.info('Handling data request SQS event', JSON.stringify(event, null, 2))
  if (event.Records.length === 0) {
    throw new Error('No data in event')
  }
  const eventData = tryParseJSON(event.Records[0].body)
  if (isEmpty(eventData)) {
    throw new Error('Event data did not include a valid JSON body')
  }
  logger.appendKeys({ zendeskId: eventData.zendeskId })

  if (isDataRequestParams(eventData)) {
    await initiateDataTransfer(eventData as DataRequestParams)
  } else if (isContinueDataTransferParams(eventData)) {
    const params = eventData as ContinueDataTransferParams
    await checkDataTransferStatus(params.zendeskId)
  } else {
    throw new Error('Event data was not of the correct type')
  }

  return {}
}
