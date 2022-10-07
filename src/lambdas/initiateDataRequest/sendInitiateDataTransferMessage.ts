import { sendSqsMessage } from '../../sharedServices/queue/sendSqsMessage'
import { DataRequestParams } from '../../types/dataRequestParams'
import { getEnv } from '../../utils/helpers'

export const sendInitiateDataTransferMessage = (
  dataRequestParams: DataRequestParams
): Promise<string | undefined> => {
  return sendSqsMessage(
    dataRequestParams,
    getEnv('INITIATE_DATA_REQUEST_QUEUE_URL')
  )
}
