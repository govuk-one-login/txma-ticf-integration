import { DataRequestParams } from '../../types/dataRequestParams'
import { getEnv } from '../../utils/helpers'
import { sendSqsMessage } from './sendSqsMessage'
export const sendInitiateDataTransferMessage = async (
  dataRequestParams: DataRequestParams
) => {
  await sendSqsMessage(
    dataRequestParams,
    getEnv('INITIATE_DATA_REQUEST_QUEUE_URL')
  )
}
