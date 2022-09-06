import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda'
import { initiateDataTransfer } from '../services/initiateDataTransfer'
import { updateZendeskTicket } from '../services/updateZendeskTicket'
import { isValidSignature } from '../services/validateRequestSource'
import { validateZendeskRequest } from '../services/validateZendeskRequest'
import { DataRequestParams } from '../types/dataRequestParams'
import { ValidatedDataRequestParamsResult } from '../types/validatedDataRequestParamsResult'

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headerSignature = event.headers['X-Zendesk-Webhook-Signature'] as string
  const timestamp = event.headers[
    'X-Zendesk-Webhook-Signature-Timestamp'
  ] as string
  if (
    !(await isValidSignature(headerSignature, event.body as string, timestamp))
  ) {
    return await handleInvalidRequest()
  }
  console.log('received Zendesk webhook', JSON.stringify(event, null, 2))
  const validatedZendeskRequest = validateZendeskRequest(event.body)
  if (!validatedZendeskRequest.isValid) {
    return await handleInvalidRequest(event.body, validatedZendeskRequest)
  }
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
  requestBody: string | null = null,
  validatedZendeskRequest: ValidatedDataRequestParamsResult | null = null
) => {
  let validationMessage
  if (!validatedZendeskRequest) {
    validationMessage = 'Invalid request source'
  } else {
    validationMessage =
      validatedZendeskRequest.validationMessage ?? 'Ticket parameters invalid'
    const newTicketStatus = 'closed'
    await updateZendeskTicket(requestBody, validationMessage, newTicketStatus)
  }
  return {
    statusCode: 400,
    body: JSON.stringify({
      message: validationMessage
    })
  }
}
