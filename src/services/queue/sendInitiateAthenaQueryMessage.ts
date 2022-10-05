import { DataRequestParams } from '../../types/dataRequestParams'
import { getEnv } from '../../utils/helpers'
import { sendSqsMessage } from './sendSqsMessage'

export const sendInitiateAthenaQueryMessage = (
  // TODO: check param type once event type handling is done
  zendeskIdObject: DataRequestParams
): Promise<string | undefined> => {
  return sendSqsMessage(
    zendeskIdObject,
    getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
  )
}
