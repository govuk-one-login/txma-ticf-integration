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
import { retrieveZendeskApiSecrets } from '../services/retrieveZendeskApiSecrets'
import { base64Encode, makeHttpsRequest } from '../services/httpsRequestUtils'
import https from 'node:https'
import {
  CustomField,
  isZendesktTicketResult,
  ZendeskTicket
} from '../types/zendeskTicketResult'
import { ZendeskUser } from '../types/zendeskUser'
import { getEnv } from '../utils/helpers'

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

  const matchesZendeskTicket = await matchZendeskTicket(
    validatedZendeskRequest.dataRequestParams as DataRequestParams
  )

  if (!matchesZendeskTicket) {
    return await handleUnmatchedRequest(
      validatedZendeskRequest.dataRequestParams as DataRequestParams
    )
  }

  const messageId = await sendInitiateDataTransferMessage(
    validatedZendeskRequest.dataRequestParams as DataRequestParams
  )

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
  const message =
    'Your ticket has been closed because a request was received for this ticket with details that do not match its current state.'
  await updateZendeskTicketById(
    requestDetails.zendeskId,
    message,
    newTicketStatus
  )

  return {
    statusCode: 400,
    body: JSON.stringify({
      message: message
    })
  }
}

const matchZendeskTicket = async (requestParams: DataRequestParams) => {
  console.log('Matching received request with existing Zendesk Tickets')
  const ticketDetails = (await getZendeskTicket(
    requestParams.zendeskId
  )) as ZendeskTicket
  const userDetails = (await getZendeskUser(
    ticketDetails.requester_id
  )) as ZendeskUser

  if (compareTicketAndRequestDetails(ticketDetails, userDetails, requestParams))
    return true
  else return false
}

const getZendeskTicket = async (
  id: string
): Promise<ZendeskTicket | undefined> => {
  const secrets = await retrieveZendeskApiSecrets()
  const options: https.RequestOptions = {
    method: 'GET',
    hostname: secrets.zendeskHostName,
    path: `/api/v2/tickets/${id}`,
    headers: {
      Authorization: base64Encode(
        `${secrets.zendeskApiUserEmail}/token:${secrets.zendeskApiKey}`
      )
    }
  }

  const data = await makeHttpsRequest(options)

  if (isZendesktTicketResult(data)) {
    const ticketInfo = data.ticket
    console.log('Zendesk ticket with matching id found', ticketInfo)

    return ticketInfo
  }
}

const getZendeskUser = async (userId: string) => {
  const secrets = await retrieveZendeskApiSecrets()
  const options: https.RequestOptions = {
    method: 'GET',
    hostname: secrets.zendeskHostName,
    path: `/api/v2/users/${userId}`,
    headers: {
      Authorization: base64Encode(
        `${secrets.zendeskApiUserEmail}/token:${secrets.zendeskApiKey}`
      )
    }
  }

  const data = (await makeHttpsRequest(options)) as ZendeskUser
  console.log('Found user', data)

  return data
}

const getZendeskCustomFieldValues = (customFields: CustomField[]) => {
  const assert = <T>(field: T | undefined): T => {
    if (field === undefined || field === null) {
      throw new TypeError('Custom field not found')
    }

    return field
  }

  const zendeskCustomFieldIds = {
    dataPaths: getEnv('ZENDESK_FIELD_DATA_PATHS'),
    dateFrom: getEnv('ZENDESK_FIELD_DATE_FROM'),
    dateTo: getEnv('ZENDESK_FIELD_DATE_TO'),
    eventIds: getEnv('ZENDESK_FIELD_EVENT_IDS'),
    identifierType: getEnv('ZENDESK_FIELD_IDENTIFIER_TYPE'),
    journeyIds: getEnv('ZENDESK_FIELD_JOURNEY_IDS'),
    piiTypes: getEnv('ZENDESK_FIELD_PII_TYPES'),
    sessionIds: getEnv('ZENDESK_FIELD_SESSION_IDS'),
    userIds: getEnv('ZENDESK_FIELD_USER_IDS')
  }

  return Object.fromEntries(
    Object.entries(zendeskCustomFieldIds).map(([k, v]) => [
      k,
      assert(customFields.find((field) => field.id === v)).value
    ])
  )
}

const compareTicketAndRequestDetails = (
  ticketDetails: ZendeskTicket,
  userDetails: ZendeskUser,
  requestParams: DataRequestParams
) => {
  const customFields = ticketDetails.custom_fields
  const customFieldValues = getZendeskCustomFieldValues(customFields)

  const ticketParams = {
    zendeskId: ticketDetails.id,
    resultsEmail: userDetails.email,
    resultsName: userDetails.name,
    ...customFieldValues
  } as DataRequestParams

  // if (Object.entries(ticketParams).sort().toString() !== Object.entries(requestParams).sort().toString()) {
  //   console.log('Request does not match values on Ticket')
  //   console.log('Request object:', requestParams)
  //   console.log('Ticket object:', ticketParams)
  //   return false
  // } else {
  //   return true
  // }

  if (
    ticketParams.zendeskId !== requestParams.zendeskId ||
    ticketParams.resultsEmail !== requestParams.resultsEmail ||
    ticketParams.resultsName !== requestParams.resultsName ||
    ticketParams.dateFrom !== requestParams.dateFrom ||
    ticketParams.dateTo !== requestParams.dateTo ||
    ticketParams.eventIds?.sort().toString !==
      requestParams.eventIds?.sort().toString() ||
    ticketParams.identifierType !== requestParams.identifierType ||
    ticketParams.journeyIds?.sort().toString() !==
      requestParams.journeyIds?.sort().toString() ||
    ticketParams.piiTypes?.sort().toString() !==
      requestParams.piiTypes?.sort().toString() ||
    ticketParams.sessionIds?.sort().toString() !==
      requestParams.sessionIds?.sort().toString() ||
    ticketParams.userIds?.sort().toString() !==
      requestParams.userIds?.sort().toString()
  ) {
    console.log('Request does not match values on Ticket')
    console.log('Request object:', requestParams)
    console.log('Ticket object:', ticketParams)
    return false
  } else {
    return true
  }
}
