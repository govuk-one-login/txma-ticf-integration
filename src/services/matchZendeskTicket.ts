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

  if (compareTicketAndRequestDetails(ticketDetails, userDetails, requestParams))
    return true
  else return false
}

const getZendeskCustomFieldValue = (
  ticketDetails: ZendeskTicket,
  id: string
) => {
  const assert = <T>(field: T | undefined): T => {
    if (field === undefined || field === null) {
      throw new TypeError('Custom field not found')
    }

    return field
  }

  return assert(ticketDetails.custom_fields.find((field) => field.id === id))
    .value
}

const compareTicketAndRequestParameter = (
  ticketParam?: string | string[],
  requestParam?: string | string[]
) => {
  let compareTicketParam: string | undefined
  let compareRequestParam: string | undefined

  if (Array.isArray(ticketParam)) {
    compareTicketParam = ticketParam.sort().toString()
  } else {
    compareTicketParam = ticketParam
  }

  if (Array.isArray(requestParam)) {
    compareRequestParam = requestParam.sort.toString()
  } else {
    compareRequestParam = requestParam
  }

  return compareTicketParam === compareRequestParam
}

const compareTicketAndRequestDetails = (
  ticketDetails: ZendeskTicket,
  userDetails: ZendeskUser,
  requestParams: DataRequestParams
) => {
  const mismatchedParameters: string[] = []

  if (
    !compareTicketAndRequestParameter(ticketDetails.id, requestParams.zendeskId)
  )
    mismatchedParameters.push('zendeskId')
  if (
    !compareTicketAndRequestParameter(
      userDetails.email,
      requestParams.resultsEmail
    )
  )
    mismatchedParameters.push('resultsEmail')
  if (
    !compareTicketAndRequestParameter(
      userDetails.name,
      requestParams.resultsName
    )
  )
    mismatchedParameters.push('resultsName')
  if (
    !compareTicketAndRequestParameter(
      getZendeskCustomFieldValue(
        ticketDetails,
        getEnv('ZENDESK_FIELD_DATA_PATHS')
      )?.split(' '),
      requestParams.dataPaths
    )
  )
    mismatchedParameters.push('dataPaths')
  if (
    !compareTicketAndRequestParameter(
      getZendeskCustomFieldValue(
        ticketDetails,
        getEnv('ZENDESK_FIELD_DATE_FROM')
      ),
      requestParams.dateFrom
    )
  )
    mismatchedParameters.push('dateFrom')
  if (
    !compareTicketAndRequestParameter(
      getZendeskCustomFieldValue(
        ticketDetails,
        getEnv('ZENDESK_FIELD_DATE_TO')
      ),
      requestParams.dateTo
    )
  )
    mismatchedParameters.push('dateTo')
  if (
    !compareTicketAndRequestParameter(
      getZendeskCustomFieldValue(
        ticketDetails,
        getEnv('ZENDESK_FIELD_EVENT_IDS')
      )?.split(' '),
      requestParams.eventIds
    )
  )
    mismatchedParameters.push('eventIds')
  if (
    getZendeskCustomFieldValue(
      ticketDetails,
      getEnv('ZENDESK_FIELD_IDENTIFIER_TYPE')
    ) !== requestParams.identifierType
  )
    mismatchedParameters.push('identifierType')
  if (
    !compareTicketAndRequestParameter(
      getZendeskCustomFieldValue(
        ticketDetails,
        getEnv('ZENDESK_FIELD_JOURNEY_IDS')
      )?.split(' '),
      requestParams.journeyIds
    )
  )
    mismatchedParameters.push('journeyIds')
  if (
    !compareTicketAndRequestParameter(
      getZendeskCustomFieldValue(
        ticketDetails,
        getEnv('ZENDESK_FIELD_PII_TYPES')
      )?.split(' '),
      requestParams.piiTypes
    )
  )
    mismatchedParameters.push('piiTypes')
  if (
    !compareTicketAndRequestParameter(
      getZendeskCustomFieldValue(
        ticketDetails,
        getEnv('ZENDESK_FIELD_SESSION_IDS')
      )?.split(' '),
      requestParams.sessionIds
    )
  )
    mismatchedParameters.push('sessionIds')
  if (
    !compareTicketAndRequestParameter(
      getZendeskCustomFieldValue(
        ticketDetails,
        getEnv('ZENDESK_FIELD_USER_IDS')
      )?.split(' '),
      requestParams.userIds
    )
  )
    mismatchedParameters.push('userIds')

  if (mismatchedParameters.length > 0) {
    console.log(
      'Request does not match values on Ticket, the following parameters do not match:',
      mismatchedParameters
    )
    return false
  } else {
    return true
  }
}
