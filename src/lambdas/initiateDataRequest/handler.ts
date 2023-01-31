import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context
} from 'aws-lambda'
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
import {
  sendAuditDataRequestMessage,
  sendIllegalRequestAuditMessage
} from '../../sharedServices/queue/sendAuditMessage'
import { tryParseJSON } from '../../utils/helpers'
import { initialiseLogger, logger } from '../../sharedServices/logger'

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  initialiseLogger(context)
  logger.info('received Zendesk webhook', JSON.stringify(event, null, 2))

  const parsedEventBody = tryParseJSON(event.body ?? '')
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
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: interpolateTemplate('ticketNotFound', zendeskCopy)
      })
    }
  }

  const messageId = (await sendInitiateDataTransferMessage(requestParams)) ?? ''

  logger.info('Sent data transfer queue message', { messageId })

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
  logger.info(interpolateTemplate('requestInvalid', loggingCopy))
  const validationMessage =
    validatedZendeskRequest.validationMessage ?? 'Ticket parameters invalid'
  logger.info('Validation message: ', validationMessage)
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
  logger.warn(interpolateTemplate('invalidWebhookSignature', loggingCopy))
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
