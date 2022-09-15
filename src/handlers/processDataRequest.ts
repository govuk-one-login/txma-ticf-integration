import { SQSEvent } from 'aws-lambda'
import { initiateDataTransfer } from '../services/initiateDataTransfer'
import {
  DataRequestParams,
  isDataRequestParams
} from '../types/dataRequestParams'
export const handler = async (event: SQSEvent) => {
  console.log('Handling data request SQS event', JSON.stringify(event, null, 2))
  if (event.Records.length === 0) {
    throw new Error('No data in event')
  }
  const eventData = JSON.parse(event.Records[0].body)
  if (!isDataRequestParams(eventData)) {
    throw new Error('Request data was not of the correct type')
  }

  await initiateDataTransfer(eventData as DataRequestParams)
  return {}
}
