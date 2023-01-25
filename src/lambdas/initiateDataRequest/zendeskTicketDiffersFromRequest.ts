import { loggingCopy } from '../../constants/loggingCopy'
import { logger } from '../../sharedServices/logger'
import { getZendeskTicket } from '../../sharedServices/zendesk/getZendeskTicket'
import { getZendeskUser } from '../../sharedServices/zendesk/getZendeskUser'
import { DataRequestParams } from '../../types/dataRequestParams'
import { ZendeskTicket } from '../../types/zendeskTicketResult'
import { ZendeskUser } from '../../types/zendeskUserResult'
import {
  getEnvAsNumber,
  mapSpaceSeparatedStringToList,
  removeZendeskPiiTypePrefixFromPiiType
} from '../../utils/helpers'
import { interpolateTemplate } from '../../utils/interpolateTemplate'

export const zendeskTicketDiffersFromRequest = async (
  requestParams: DataRequestParams
) => {
  logger.info(interpolateTemplate('requestMatchesZendeskTickets', loggingCopy))
  const ticketDetails = await getZendeskTicket(requestParams.zendeskId)
  const requesterDetails = await getZendeskUser(ticketDetails.requester_id)

  return ticketAndRequestDetailsDiffer(
    ticketDetails,
    requesterDetails,
    requestParams
  )
}

const getZendeskCustomFieldValue = (
  ticketDetails: ZendeskTicket,
  id: number
) => {
  const assert = <T>(field: T | undefined): T => {
    if (field === undefined || field === null) {
      throw new TypeError(`Custom field with id ${id} not found`)
    }

    return field
  }

  return assert(ticketDetails.custom_fields.find((field) => field.id === id))
    .value
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
  customFieldId: number
): string[] => {
  const fieldValue = getZendeskCustomFieldValue(
    ticketDetails,
    customFieldId
  ) as string
  return mapSpaceSeparatedStringToList(fieldValue)
}

const ticketAndRequestDetailsDiffer = (
  ticketDetails: ZendeskTicket,
  requesterDetails: ZendeskUser,
  requestParams: DataRequestParams
) => {
  const unmatchedParameters: string[] = []

  const ticketDataPaths = getZendeskCustomSpaceSeparatedStringAsArray(
    ticketDetails,
    getEnvAsNumber('ZENDESK_FIELD_ID_DATA_PATHS')
  ) as string[]
  const ticketDateFrom = getZendeskCustomFieldValue(
    ticketDetails,
    getEnvAsNumber('ZENDESK_FIELD_ID_DATE_FROM')
  ) as string | null
  const ticketDateTo = getZendeskCustomFieldValue(
    ticketDetails,
    getEnvAsNumber('ZENDESK_FIELD_ID_DATE_TO')
  ) as string | null
  const ticketEventIds = getZendeskCustomSpaceSeparatedStringAsArray(
    ticketDetails,
    getEnvAsNumber('ZENDESK_FIELD_ID_EVENT_IDS')
  ) as string[]
  const ticketJourneyIds = getZendeskCustomSpaceSeparatedStringAsArray(
    ticketDetails,
    getEnvAsNumber('ZENDESK_FIELD_ID_JOURNEY_IDS')
  ) as string[]
  const ticketPiiTypes =
    (getZendeskCustomFieldValue(
      ticketDetails,
      getEnvAsNumber('ZENDESK_FIELD_ID_PII_TYPES')
    ) as string[]) ?? []
  const ticketSessionIds = getZendeskCustomSpaceSeparatedStringAsArray(
    ticketDetails,
    getEnvAsNumber('ZENDESK_FIELD_ID_SESSION_IDS')
  ) as string[]
  const ticketUserIds = getZendeskCustomSpaceSeparatedStringAsArray(
    ticketDetails,
    getEnvAsNumber('ZENDESK_FIELD_ID_USER_IDS')
  ) as string[]
  const ticketRecipientEmail = getZendeskCustomFieldValue(
    ticketDetails,
    getEnvAsNumber('ZENDESK_FIELD_ID_RECIPIENT_EMAIL')
  ) as string | null
  const ticketRecipientName = getZendeskCustomFieldValue(
    ticketDetails,
    getEnvAsNumber('ZENDESK_FIELD_ID_RECIPIENT_NAME')
  ) as string | null

  if (!matchStringParams(ticketDetails.id.toString(), requestParams.zendeskId))
    unmatchedParameters.push('zendeskId')
  if (!matchStringParams(ticketRecipientEmail, requestParams.recipientEmail))
    unmatchedParameters.push('recipientEmail')
  if (!matchStringParams(ticketRecipientName, requestParams.recipientName))
    unmatchedParameters.push('recipientName')
  if (!matchStringParams(requesterDetails.email, requestParams.requesterEmail))
    unmatchedParameters.push('requesterEmail')
  if (!matchStringParams(requesterDetails.name, requestParams.requesterName))
    unmatchedParameters.push('requesterName')
  if (!matchArrayParams(ticketDataPaths, requestParams.dataPaths))
    unmatchedParameters.push('dataPaths')
  if (!matchStringParams(ticketDateFrom, requestParams.dateFrom))
    unmatchedParameters.push('dateFrom')
  if (!matchStringParams(ticketDateTo, requestParams.dateTo))
    unmatchedParameters.push('dateTo')
  if (!matchArrayParams(ticketEventIds, requestParams.eventIds))
    unmatchedParameters.push('eventIds')
  if (!matchArrayParams(ticketJourneyIds, requestParams.journeyIds))
    unmatchedParameters.push('journeyIds')
  if (
    !matchArrayParams(
      ticketPiiTypes.map(removeZendeskPiiTypePrefixFromPiiType),
      requestParams.piiTypes
    )
  )
    unmatchedParameters.push('piiTypes')
  if (!matchArrayParams(ticketSessionIds, requestParams.sessionIds))
    unmatchedParameters.push('sessionIds')
  if (!matchArrayParams(ticketUserIds, requestParams.userIds))
    unmatchedParameters.push('userIds')

  if (unmatchedParameters.length > 0) {
    logger.warn(
      interpolateTemplate('requestDoesntMatcheZendeskTickets', loggingCopy),
      JSON.stringify(unmatchedParameters)
    )
    return true
  } else {
    logger.info(
      interpolateTemplate('requestMatchesExistingZendeskTickets', loggingCopy)
    )
    return false
  }
}
