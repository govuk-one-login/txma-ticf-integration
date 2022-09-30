import { DataRequestParams } from '../types/dataRequestParams'
import { ZendeskTicket } from '../types/zendeskTicketResult'
import { ZendeskUser } from '../types/zendeskUser'
import { getEnv } from '../utils/helpers'
import { getZendeskTicket } from './getZendeskTicket'
import { getZendeskUser } from './getZendeskUser'

export const zendeskTicketDiffersFromRequest = async (
  requestParams: DataRequestParams
) => {
  console.log('Matching received request with existing Zendesk Tickets')
  const ticketDetails = await getZendeskTicket(requestParams.zendeskId)
  const userDetails = await getZendeskUser(ticketDetails.requester_id)

  return ticketAndRequestDetailsDiffer(
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

const matchArrayParams = (ticketParam: string[], requestParam: string[]) => {
  return (
    ticketParam.sort((a, b) => a.localeCompare(b)).toString() ===
    requestParam.sort((a, b) => a.localeCompare(b)).toString()
  )
}

const matchStringParams = (
  ticketParam: string | null,
  requestParam: string | undefined
) => {
  if (ticketParam === null && requestParam === undefined) return true

  return ticketParam === requestParam
}

const getZendeskCustomSpaceSeparatedStringAsArray = (
  ticketDetails: ZendeskTicket,
  customFieldId: string
): string[] => {
  const fieldValue = getZendeskCustomFieldValue(ticketDetails, customFieldId)
  return fieldValue ? fieldValue.split(' ') : []
}
const ticketAndRequestDetailsDiffer = (
  ticketDetails: ZendeskTicket,
  userDetails: ZendeskUser,
  requestParams: DataRequestParams
) => {
  const unmatchedParameters: string[] = []

  const ticketDataPaths: string[] = getZendeskCustomSpaceSeparatedStringAsArray(
    ticketDetails,
    getEnv('ZENDESK_FIELD_DATA_PATHS')
  )
  const ticketDateFrom: string = getZendeskCustomFieldValue(
    ticketDetails,
    getEnv('ZENDESK_FIELD_DATE_FROM')
  )
  const ticketDateTo: string = getZendeskCustomFieldValue(
    ticketDetails,
    getEnv('ZENDESK_FIELD_DATE_TO')
  )
  const ticketEventIds: string[] = getZendeskCustomSpaceSeparatedStringAsArray(
    ticketDetails,
    getEnv('ZENDESK_FIELD_EVENT_IDS')
  )

  const ticketIdentifierType: string = getZendeskCustomFieldValue(
    ticketDetails,
    getEnv('ZENDESK_FIELD_IDENTIFIER_TYPE')
  )
  const ticketJourneyIds: string[] =
    getZendeskCustomSpaceSeparatedStringAsArray(
      ticketDetails,
      getEnv('ZENDESK_FIELD_JOURNEY_IDS')
    )
  const ticketPiiTypes: string[] = getZendeskCustomSpaceSeparatedStringAsArray(
    ticketDetails,
    getEnv('ZENDESK_FIELD_PII_TYPES')
  )
  const ticketSessionIds: string[] =
    getZendeskCustomSpaceSeparatedStringAsArray(
      ticketDetails,
      getEnv('ZENDESK_FIELD_SESSION_IDS')
    )
  const ticketUserIds: string[] = getZendeskCustomSpaceSeparatedStringAsArray(
    ticketDetails,
    getEnv('ZENDESK_FIELD_USER_IDS')
  )

  if (!matchStringParams(ticketDetails.id, requestParams.zendeskId))
    unmatchedParameters.push('zendeskId')
  if (!matchStringParams(userDetails.email, requestParams.resultsEmail))
    unmatchedParameters.push('resultsEmail')
  if (!matchStringParams(userDetails.name, requestParams.resultsName))
    unmatchedParameters.push('resultsName')
  if (!matchArrayParams(ticketDataPaths, requestParams.dataPaths))
    unmatchedParameters.push('dataPaths')
  if (!matchStringParams(ticketDateFrom, requestParams.dateFrom))
    unmatchedParameters.push('dateFrom')
  if (!matchStringParams(ticketDateTo, requestParams.dateTo))
    unmatchedParameters.push('dateTo')
  if (!matchArrayParams(ticketEventIds, requestParams.eventIds))
    unmatchedParameters.push('eventIds')
  if (!matchStringParams(ticketIdentifierType, requestParams.identifierType))
    unmatchedParameters.push('identifierType')
  if (!matchArrayParams(ticketJourneyIds, requestParams.journeyIds))
    unmatchedParameters.push('journeyIds')
  if (!matchArrayParams(ticketPiiTypes, requestParams.piiTypes))
    unmatchedParameters.push('piiTypes')
  if (!matchArrayParams(ticketSessionIds, requestParams.sessionIds))
    unmatchedParameters.push('sessionIds')
  if (!matchArrayParams(ticketUserIds, requestParams.userIds))
    unmatchedParameters.push('userIds')

  if (unmatchedParameters.length > 0) {
    console.warn(
      'Request does not match values on Ticket, the following parameters do not match:',
      unmatchedParameters
    )
    return true
  } else {
    return false
  }
}
