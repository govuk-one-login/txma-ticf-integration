import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda'
import { initiateDataTransfer } from '../services/initiateDataTransfer'
import { updateZendeskTicket } from '../services/updateZendeskTicket'
import { isSignatureInvalid } from '../services/validateRequestSource'
import { validateZendeskRequest } from '../services/validateZendeskRequest'
import { DataRequestParams } from '../types/dataRequestParams'
import { ValidatedDataRequestParamsResult } from '../types/validatedDataRequestParamsResult'

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (await isSignatureInvalid(event.headers, event.body)) {
    return await handleInvalidSignature()
  }
  console.log('received Zendesk webhook', JSON.stringify(event, null, 2))

  const validatedZendeskRequest = validateZendeskRequest(event.body)
  if (!validatedZendeskRequest.isValid) {
    return await handleInvalidRequest(event.body, validatedZendeskRequest)
  }

  console.log('Zendesk request was valid')

  const dataTransferInitiateResult = await initiateDataTransfer(
    validatedZendeskRequest.dataRequestParams as DataRequestParams
  )

  return {
    statusCode: dataTransferInitiateResult.success ? 200 : 400,
    body: JSON.stringify({
      message: dataTransferInitiateResult.success
        ? 'data transfer initiated'
        : dataTransferInitiateResult.errorMessage
    })
  }
}

const handleInvalidRequest = async (
  requestBody: string | null,
  validatedZendeskRequest: ValidatedDataRequestParamsResult
) => {
  console.log('Zendesk request was invalid')
  const validationMessage =
    validatedZendeskRequest.validationMessage ?? 'Ticket parameters invalid'
  const newTicketStatus = 'closed'
  await updateZendeskTicket(
    requestBody,
    `Your ticket has been closed because some fields were invalid. Here is the list of what was wrong: ${validationMessage}`,
    newTicketStatus
  )
  return {
    statusCode: 400,
    body: JSON.stringify({
      message: validationMessage
    })
  }
}

const handleInvalidSignature = async () => {
  console.warn('Request received with invalid webhook signature')
  return {
    statusCode: 400,
    body: JSON.stringify({
      message: 'Invalid request source'
    })
  }
}
