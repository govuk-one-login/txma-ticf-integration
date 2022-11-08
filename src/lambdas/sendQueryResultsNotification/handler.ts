import { EventBridgeEvent } from 'aws-lambda'
import { getQueryByAthenaQueryId } from '../../sharedServices/dynamoDB/dynamoDBGet'
import { sendQueryOutputGeneratedAuditMessage } from '../../sharedServices/queue/sendAuditMessage'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { AthenaEBEventDetails } from '../../types/athenaEBEventDetails'
import { generateSecureDownloadHash } from './generateSecureDownloadHash'
import { queueSendResultsReadyEmail } from './queueSendResultsReadyEmail'
import { writeOutSecureDownloadRecord } from './writeOutSecureDownloadRecord'

export const handler = async (
  event: EventBridgeEvent<'Athena Query State Change', AthenaEBEventDetails>
): Promise<void> => {
  console.log('received event', JSON.stringify(event, null, 2))

  const queryDetails = event.detail
  const athenaQueryId = queryDetails.queryExecutionId

  const requestData = await getQueryByAthenaQueryId(athenaQueryId)
  const zendeskTicketId = requestData.requestInfo.zendeskId

  try {
    await confirmQueryState(queryDetails, zendeskTicketId)
  } catch (error) {
    console.error(error)
    return
  }

  await sendQueryOutputGeneratedAuditMessage(zendeskTicketId)

  const recipientName = requestData.requestInfo.recipientName
  const recipientEmail = requestData.requestInfo.recipientEmail
  const downloadHash = generateSecureDownloadHash()

  await writeOutSecureDownloadRecord(
    athenaQueryId,
    downloadHash,
    zendeskTicketId
  )

  await queueSendResultsReadyEmail({
    downloadHash,
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
