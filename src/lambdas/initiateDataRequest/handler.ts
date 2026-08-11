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
  const startTime = Date.now()

  logger.info('Initiate data request started')

  const parsedEventBody = tryParseJSON(event.body ?? '')
  appendZendeskIdToLogger(parsedEventBody.zendeskId)

  await sendAuditDataRequestMessage(parsedEventBody)

  if (await isSignatureInvalid(event.headers, event.body)) {
    await sendIllegalRequestAuditMessage(
      parsedEventBody.zendeskId,
      'invalid-signature'
    )
    return await handleInvalidSignature(startTime)
  }

  const validatedZendeskRequest = await validateZendeskRequest(event.body)

  if (!validatedZendeskRequest.isValid) {
    return await handleInvalidRequest(
      event.body,
      validatedZendeskRequest,
      startTime
    )
  }

  const requestParams =
    validatedZendeskRequest.dataRequestParams as DataRequestParams

  try {
    if (await zendeskTicketDiffersFromRequest(requestParams)) {
      await sendIllegalRequestAuditMessage(
        requestParams.zendeskId,
        'mismatched-ticket'
      )
      return await handleUnmatchedRequest(requestParams.zendeskId, startTime)
    }
  } catch (error) {
    logger.error('Failed to validate Zendesk ticket match', {
      errorCode: 'TICF001',
      error: {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
        stack: error instanceof Error ? error.stack : undefined
      }
    })
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

  logger.info('Initiate data request completed', {
    outcome: 'success',
    duration: Date.now() - startTime,
    messageId
  })

  return createApiResponse({
    statusCode: 200,
    body: JSON.stringify({
      message: interpolateTemplate('transferInitiated', zendeskCopy)
    })
  })
}

const handleInvalidRequest = async (
  requestBody: string | null,
  validatedZendeskRequest: ValidatedDataRequestParamsResult,
  startTime: number
) => {
  const validationMessage =
    validatedZendeskRequest.validationMessage ?? 'Ticket parameters invalid'
  logger.warn('Zendesk request was invalid', {
    errorCode: 'TICF002',
    validationMessage
  })
  const newTicketStatus = 'closed'
  await updateZendeskTicket(
    requestBody,
    interpolateTemplate('ticketClosed', zendeskCopy, {
      validationMessage
    }),
    newTicketStatus
  )

  logger.info('Initiate data request completed', {
    outcome: 'failure',
    duration: Date.now() - startTime
  })

  return createApiResponse({
    statusCode: 400,
    body: JSON.stringify({
      message: validationMessage
    })
  })
}

const handleInvalidSignature = async (startTime: number) => {
  logger.warn('Request received with invalid webhook signature', {
    errorCode: 'TICF003'
  })

  logger.info('Initiate data request completed', {
    outcome: 'failure',
    duration: Date.now() - startTime
  })

  return createApiResponse({
    statusCode: 400,
    body: JSON.stringify({
      message: interpolateTemplate('invalidSignature', zendeskCopy)
    })
  })
}

const handleUnmatchedRequest = async (zendeskId: string, startTime: number) => {
  const newTicketStatus = 'closed'

  await updateZendeskTicketById(
    zendeskId,
    interpolateTemplate('ticketClosedMismatchWithState', zendeskCopy),
    newTicketStatus
  )

  logger.info('Initiate data request completed', {
    outcome: 'failure',
    duration: Date.now() - startTime
  })

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
