import { DataRequestParams } from '../types/dataRequestParams'
import { ZendeskTicket } from '../types/zendeskTicketResult'
import { ZendeskUser } from '../types/zendeskUser'
import { getEnv } from '../utils/helpers'
import { getZendeskTicket } from './getZendeskTicket'
import { getZendeskUser } from './getZendeskUser'

export const matchZendeskTicket = async (requestParams: DataRequestParams) => {
  console.log('Matching received request with existing Zendesk Tickets')
  const ticketDetails = (await getZendeskTicket(
    requestParams.zendeskId
  )) as ZendeskTicket
  const userDetails = (await getZendeskUser(
    ticketDetails.requester_id
  )) as ZendeskUser

  return compareTicketAndRequestDetails(
    ticketDetails,
    userDetails,
    requestParams
  )
}

const getZendeskCustomFieldValue = (
  ticketDetails: ZendeskTicket,
  id: string
) => {
  const assert = <T>(field: T | undefined): T => {
    if (field === undefined || field === null) {
      throw new TypeError(`Custom field with id ${id} not found`)
    }

    return field
  }

  return assert(ticketDetails.custom_fields.find((field) => field.id === id))
    .value as string
}

const matchArrayParams = (
  ticketParam: string[] | null,
  requestParam: string[] | undefined
) => {
  if (ticketParam === null && requestParam === undefined) return true

  return (
    ticketParam?.sort((a, b) => a.localeCompare(b)).toString() ===
    requestParam?.sort((a, b) => a.localeCompare(b)).toString()
  )
}

const matchStringParams = (
  ticketParam: string | null,
  requestParam: string | undefined
) => {
  if (ticketParam === null && requestParam === undefined) return true

  return ticketParam === requestParam
}

const compareTicketAndRequestDetails = (
  ticketDetails: ZendeskTicket,
  userDetails: ZendeskUser,
  requestParams: DataRequestParams
) => {
  const mismatchedParameters: string[] = []

  const ticketDataPaths: string[] = getZendeskCustomFieldValue(
    ticketDetails,
    getEnv('ZENDESK_FIELD_DATA_PATHS')
  )?.split(' ')
  const ticketDateFrom: string = getZendeskCustomFieldValue(
    ticketDetails,
    getEnv('ZENDESK_FIELD_DATE_FROM')
  )
  const ticketDateTo: string = getZendeskCustomFieldValue(
    ticketDetails,
    getEnv('ZENDESK_FIELD_DATE_TO')
  )
  const ticketEventIds: string[] = getZendeskCustomFieldValue(
    ticketDetails,
    getEnv('ZENDESK_FIELD_EVENT_IDS')
  )?.split(' ')

  const ticketIdentifierType: string = getZendeskCustomFieldValue(
    ticketDetails,
    getEnv('ZENDESK_FIELD_IDENTIFIER_TYPE')
  )
  const ticketJourneyIds: string[] = getZendeskCustomFieldValue(
    ticketDetails,
    getEnv('ZENDESK_FIELD_JOURNEY_IDS')
  )?.split(' ')
  const ticketPiiTypes: string[] = getZendeskCustomFieldValue(
    ticketDetails,
    getEnv('ZENDESK_FIELD_PII_TYPES')
  )?.split(' ')
  const ticketSessionIds: string[] = getZendeskCustomFieldValue(
    ticketDetails,
    getEnv('ZENDESK_FIELD_SESSION_IDS')
  )?.split(' ')
  const ticketUserIds: string[] = getZendeskCustomFieldValue(
    ticketDetails,
    getEnv('ZENDESK_FIELD_USER_IDS')
  )?.split(' ')

  if (!matchStringParams(ticketDetails.id, requestParams.zendeskId))
    mismatchedParameters.push('zendeskId')
  if (!matchStringParams(userDetails.email, requestParams.resultsEmail))
    mismatchedParameters.push('resultsEmail')
  if (!matchStringParams(userDetails.name, requestParams.resultsName))
    mismatchedParameters.push('resultsName')
  if (!matchArrayParams(ticketDataPaths, requestParams.dataPaths))
    mismatchedParameters.push('dataPaths')
  if (!matchStringParams(ticketDateFrom, requestParams.dateFrom))
    mismatchedParameters.push('dateFrom')
  if (!matchStringParams(ticketDateTo, requestParams.dateTo))
    mismatchedParameters.push('dateTo')
  if (!matchArrayParams(ticketEventIds, requestParams.eventIds))
    mismatchedParameters.push('eventIds')
  if (!matchStringParams(ticketIdentifierType, requestParams.identifierType))
    mismatchedParameters.push('identifierType')
  if (!matchArrayParams(ticketJourneyIds, requestParams.journeyIds))
    mismatchedParameters.push('journeyIds')
  if (!matchArrayParams(ticketPiiTypes, requestParams.piiTypes))
    mismatchedParameters.push('piiTypes')
  if (!matchArrayParams(ticketSessionIds, requestParams.sessionIds))
    mismatchedParameters.push('sessionIds')
  if (!matchArrayParams(ticketUserIds, requestParams.userIds))
    mismatchedParameters.push('userIds')

  if (mismatchedParameters.length > 0) {
    console.warn(
      'Request does not match values on Ticket, the following parameters do not match:',
      mismatchedParameters
    )
    return false
  } else {
    return true
  }
}
