import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import {
  updateZendeskTicket,
  updateZendeskTicketById
} from '../../sharedServices/zendesk/updateZendeskTicket'
import { isSignatureInvalid } from './validateRequestSource'
import { validateZendeskRequest } from './validateZendeskRequest'
import { ValidatedDataRequestParamsResult } from '../../types/validatedDataRequestParamsResult'
import { sendInitiateDataTransferMessage } from './sendInitiateDataTransferMessage'
import { DataRequestParams } from '../../types/dataRequestParams'
import { zendeskTicketDiffersFromRequest } from './zendeskTicketDiffersFromRequest'
import { zendeskCopy } from '../../constants/zendeskCopy'
import { loggingCopy } from '../../constants/loggingCopy'
import { interpolateTemplate } from '../../utils/interpolateTemplate'

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
    if (await zendeskTicketDiffersFromRequest(requestParams)) {
      return await handleUnmatchedRequest(requestParams.zendeskId)
    }
  } catch (error) {
    console.error(error)
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: interpolateTemplate('ticketNotFound', zendeskCopy)
      })
    }
  }

  const messageId = (await sendInitiateDataTransferMessage(requestParams)) ?? ''

  console.log(
    interpolateTemplate('transferQueueMessageWithId', loggingCopy, {
      messageId
    })
  )

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: interpolateTemplate('transferInitiated', zendeskCopy)
    })
  }
}

const handleInvalidRequest = async (
  requestBody: string | null,
  validatedZendeskRequest: ValidatedDataRequestParamsResult
) => {
  console.log(interpolateTemplate('requestInvalid', loggingCopy))
  const validationMessage =
    validatedZendeskRequest.validationMessage ?? 'Ticket parameters invalid'
  const newTicketStatus = 'closed'
  await updateZendeskTicket(
    requestBody,
    interpolateTemplate('ticketClosed', zendeskCopy, {
      validationMessage
    }),
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
  console.warn(interpolateTemplate('invalidWebhookSignature', loggingCopy))
  return {
    statusCode: 400,
    body: JSON.stringify({
      message: interpolateTemplate('invalidSignature', zendeskCopy)
    })
  }
}

const handleUnmatchedRequest = async (zendeskId: string) => {
  const newTicketStatus = 'closed'

  await updateZendeskTicketById(
    zendeskId,
    interpolateTemplate('ticketClosedMismatchWithState', zendeskCopy),
    newTicketStatus
  )

  return {
    statusCode: 400,
    body: JSON.stringify({
      message: interpolateTemplate(
        'responseMessageWhenParamsMismatch',
        zendeskCopy
      )
    })
  }
}
