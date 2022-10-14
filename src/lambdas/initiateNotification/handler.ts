import { EventBridgeEvent } from 'aws-lambda'
import { getQueryByAthenaQueryId } from '../../sharedServices/dynamoDB/dynamoDBGet'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { AthenaEBEventDetails } from '../../types/athenaEBEventDetails'

export const handler = async (
  event: EventBridgeEvent<'Athena Query State Change', AthenaEBEventDetails>
): Promise<void> => {
  const queryDetails = event.detail

  const athenaQueryId = queryDetails.queryExecutionId

  const requestData = await getQueryByAthenaQueryId(athenaQueryId)
  const zendeskId = requestData.zendeskId

  console.log(requestData)

  await confirmQueryState(queryDetails, zendeskId)

  const recipientName = requestData.recipientName
  const recipientEmail = requestData.recipientEmail

  console.log(`Signed link being sent to ${recipientName} at ${recipientEmail}`)
}

const confirmQueryState = async (
  queryDetails: AthenaEBEventDetails,
  zendeskId: string
): Promise<void> => {
  const queryState = queryDetails.currentState

  if (queryState == 'CANCELLED' || queryState == 'FAILED') {
    const message = `Athena Query ${queryDetails.queryExecutionId} did not complete with status: ${queryState}`
    await updateZendeskTicketById(zendeskId, message, 'closed')
    return
  }

  return
}
