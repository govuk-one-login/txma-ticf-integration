import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context
} from 'aws-lambda'
import {
  updateZendeskTicket,
  updateZendeskTicketById
} from '../../../common/sharedServices/zendesk/updateZendeskTicket'
import { isSignatureInvalid } from './validateRequestSource'
import { validateZendeskRequest } from './validateZendeskRequest'
import { ValidatedDataRequestParamsResult } from '../../../common/types/validatedDataRequestParamsResult'
import { sendInitiateDataTransferMessage } from './sendInitiateDataTransferMessage'
import { DataRequestParams } from '../../../common/types/dataRequestParams'
import { zendeskTicketDiffersFromRequest } from './zendeskTicketDiffersFromRequest'
import { zendeskCopy } from '../../../common/constants/zendeskCopy'
import { loggingCopy } from '../../../common/constants/loggingCopy'
import { interpolateTemplate } from '../../../common/utils/interpolateTemplate'
import {
  sendAuditDataRequestMessage,
  sendIllegalRequestAuditMessage
} from '../../../common/sharedServices/queue/sendAuditMessage'
import { tryParseJSON } from '../../../common/utils/helpers'
import {
  appendZendeskIdToLogger,
  initialiseLogger,
  logger
} from '../../../common/sharedServices/logger'

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  initialiseLogger(context)

  const parsedEventBody = tryParseJSON(event.body ?? '')
  appendZendeskIdToLogger(parsedEventBody.zendeskId)

  await sendAuditDataRequestMessage(parsedEventBody)

  if (await isSignatureInvalid(event.headers, event.body)) {
    await sendIllegalRequestAuditMessage(
      parsedEventBody.zendeskId,
      'invalid-signature'
    )
    return await handleInvalidSignature()
  }

  const validatedZendeskRequest = await validateZendeskRequest(event.body)

  if (!validatedZendeskRequest.isValid) {
    return await handleInvalidRequest(event.body, validatedZendeskRequest)
  }

  const requestParams =
    validatedZendeskRequest.dataRequestParams as DataRequestParams

  try {
    if (await zendeskTicketDiffersFromRequest(requestParams)) {
      await sendIllegalRequestAuditMessage(
        requestParams.zendeskId,
        'mismatched-ticket'
      )
      return await handleUnmatchedRequest(requestParams.zendeskId)
    }
  } catch (error) {
    logger.error('error', error as Error)
    await sendIllegalRequestAuditMessage(
      requestParams.zendeskId,
      'non-existent-ticket'
    )
    return createApiResponse({
      statusCode: 404,
      body: JSON.stringify({
        message: interpolateTemplate('ticketNotFound', zendeskCopy)
      })
    })
  }

  const messageId = (await sendInitiateDataTransferMessage(requestParams)) ?? ''

  logger.info('Sent data transfer queue message', { messageId })

  return createApiResponse({
    statusCode: 200,
    body: JSON.stringify({
      message: interpolateTemplate('transferInitiated', zendeskCopy)
    })
  })
}

const handleInvalidRequest = async (
  requestBody: string | null,
  validatedZendeskRequest: ValidatedDataRequestParamsResult
) => {
  logger.info(interpolateTemplate('requestInvalid', loggingCopy))
  const validationMessage =
    validatedZendeskRequest.validationMessage ?? 'Ticket parameters invalid'
  logger.info('Invalid ticket data', { validationMessage })
  const newTicketStatus = 'closed'
  await updateZendeskTicket(
    requestBody,
    interpolateTemplate('ticketClosed', zendeskCopy, {
      validationMessage
    }),
    newTicketStatus
  )
  return createApiResponse({
    statusCode: 400,
    body: JSON.stringify({
      message: validationMessage
    })
  })
}

const handleInvalidSignature = async () => {
  logger.warn(interpolateTemplate('invalidWebhookSignature', loggingCopy))
  return createApiResponse({
    statusCode: 400,
    body: JSON.stringify({
      message: interpolateTemplate('invalidSignature', zendeskCopy)
    })
  })
}

const handleUnmatchedRequest = async (zendeskId: string) => {
  const newTicketStatus = 'closed'

  await updateZendeskTicketById(
    zendeskId,
    interpolateTemplate('ticketClosedMismatchWithState', zendeskCopy),
    newTicketStatus
  )

  return createApiResponse({
    statusCode: 400,
    body: JSON.stringify({
      message: interpolateTemplate(
        'responseMessageWhenParamsMismatch',
        zendeskCopy
      )
    })
  })
}

const createApiResponse = (
  response: APIGatewayProxyResult
): APIGatewayProxyResult => {
  return appendSecurityHeadersToResponse(response)
}

const appendSecurityHeadersToResponse = (
  response: APIGatewayProxyResult
): APIGatewayProxyResult => {
  if (!response.headers) {
    response.headers = {}
  }
  response.headers['Strict-Transport-Security'] =
    'max-age=31536000; includeSubDomains; preload'
  response.headers['X-Frame-Options'] = 'DENY'
  return response
}
