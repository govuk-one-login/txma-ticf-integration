import { sendSqsMessage } from '../../../common/sharedServices/queue/sendSqsMessage'
import { DataRequestParams } from '../../../common/types/dataRequestParams'
import { getEnv } from '../../../common/utils/helpers'

export const sendInitiateDataTransferMessage = (
  dataRequestParams: DataRequestParams
): Promise<string | undefined> => {
  return sendSqsMessage(
    dataRequestParams,
    getEnv('INITIATE_DATA_REQUEST_QUEUE_URL')
  )
}
