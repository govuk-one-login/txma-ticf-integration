import { Context, EventBridgeEvent } from 'aws-lambda'
import { getQueryByAthenaQueryId } from '../../../common/sharedServices/dynamoDB/dynamoDBGet'
import {
  appendZendeskIdToLogger,
  initialiseLogger,
  logger
} from '../../../common/sharedServices/logger'
import { sendQueryOutputGeneratedAuditMessage } from '../../../common/sharedServices/queue/sendAuditMessage'
import { updateZendeskTicketById } from '../../../common/sharedServices/zendesk/updateZendeskTicket'
import { AthenaEBEventDetails } from '../../../common/types/athenaEBEventDetails'
import { sendQueryCompleteQueueMessage } from './sendQueryCompleteQueueMessage'

export const handler = async (
  event: EventBridgeEvent<'Athena Query State Change', AthenaEBEventDetails>,
  context: Context
): Promise<void> => {
  initialiseLogger(context)

  const queryDetails = event.detail
  const athenaQueryId = queryDetails.queryExecutionId

  const requestData = await getQueryByAthenaQueryId(athenaQueryId)
  const zendeskTicketId = requestData.requestInfo.zendeskId

  appendZendeskIdToLogger(zendeskTicketId)
  logger.info('Retrieved request data from database by athenaQueryId', {
    athenaQueryId
  })

  try {
    await confirmQueryState(queryDetails, zendeskTicketId)
  } catch (error) {
    logger.error('failed to confirm query state', error as Error)
    return
  }

  await sendQueryOutputGeneratedAuditMessage(zendeskTicketId)

  const recipientName = requestData.requestInfo.recipientName
  const recipientEmail = requestData.requestInfo.recipientEmail

  await sendQueryCompleteQueueMessage({
    athenaQueryId,
    recipientEmail,
    recipientName,
    zendeskTicketId
  })
}

const confirmQueryState = async (
  queryDetails: AthenaEBEventDetails,
  zendeskId: string
): Promise<void> => {
  const queryState = queryDetails.currentState
  switch (queryState) {
    case 'SUCCEEDED': {
      return
    }

    case 'CANCELLED':
    case 'FAILED': {
      const message = `Athena Query ${queryDetails.queryExecutionId} did not complete with status: ${queryState}`
      await updateZendeskTicketById(zendeskId, message, 'closed')
      throw Error(message)
    }

    default:
      throw Error(
        `Function was called with unexpected state: ${queryState}. Ensure the template is configured correctly`
      )
  }
}
