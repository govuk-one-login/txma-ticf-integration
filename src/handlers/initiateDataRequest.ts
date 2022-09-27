import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda'
import {
  updateZendeskTicket,
  updateZendeskTicketById
} from '../services/updateZendeskTicket'
import { isSignatureInvalid } from '../services/validateRequestSource'
import { validateZendeskRequest } from '../services/validateZendeskRequest'
import { ValidatedDataRequestParamsResult } from '../types/validatedDataRequestParamsResult'
import { sendInitiateDataTransferMessage } from '../services/queue/sendInitiateDataTransferMessage'
import { DataRequestParams } from '../types/dataRequestParams'
import { matchZendeskTicket } from '../services/matchZendeskTicket'

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('received Zendesk webhook', JSON.stringify(event, null, 2))

  if (await isSignatureInvalid(event.headers, event.body)) {
    return await handleInvalidSignature()
  }

  const validatedZendeskRequest = validateZendeskRequest(event.body)

  if (!validatedZendeskRequest.isValid) {
    return await handleInvalidRequest(event.body, validatedZendeskRequest)
  }

  const requestParams =
    validatedZendeskRequest.dataRequestParams as DataRequestParams

  try {
    if (!(await matchZendeskTicket(requestParams))) {
      return await handleUnmatchedRequest(requestParams)
    }
  } catch (error) {
    console.error(error)
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: 'Zendesk ticket not found'
      })
    }
  }

  const messageId = await sendInitiateDataTransferMessage(requestParams)

  console.log(`Sent data transfer queue message with id '${messageId}'`)

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'data transfer initiated'
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

const handleUnmatchedRequest = async (requestDetails: DataRequestParams) => {
  const newTicketStatus = 'closed'

  await updateZendeskTicketById(
    requestDetails.zendeskId,
    'Your ticket has been closed because a request was received for this ticket with details that do not match its current state.',
    newTicketStatus
  )

  return {
    statusCode: 400,
    body: JSON.stringify({
      message: 'Request parameters do not match a Zendesk Ticket'
    })
  }
}
