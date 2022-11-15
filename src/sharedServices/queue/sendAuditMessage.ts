import {
  AuditEventType,
  ErrorType,
  ErrorObject,
  ComponentId
} from '../../types/audit/auditEventDetails'
import { AuditQueryDataRequestDetails } from '../../types/audit/auditQueryDataRequestDetails'
import { currentDateEpochMilliseconds } from '../../utils/currentDateEpochMilliseconds'
import { getEnv } from '../../utils/helpers'
import { sendSqsMessage } from './sendSqsMessage'

export const sendAuditDataRequestMessage = async (
  auditQueryRequestDetails: AuditQueryDataRequestDetails
) => {
  try {
    const auditDataRequestEvent: AuditEventType = {
      event_name: 'TXMA_AUDIT_QUERY_DATA_REQUEST',
      ...createAuditMessageBaseObjectDetails(),
      restricted: {
        requesterEmail: auditQueryRequestDetails.requesterEmail,
        requesterName: auditQueryRequestDetails.requesterName,
        recipientEmail: auditQueryRequestDetails.recipientEmail,
        recipientName: auditQueryRequestDetails.recipientName
      },
      extensions: {
        ticket_details: {
          zendeskId: auditQueryRequestDetails.zendeskId,
          dateFrom: auditQueryRequestDetails.dateFrom,
          dateTo: auditQueryRequestDetails.dateTo,
          identifierType: auditQueryRequestDetails.identifierType,
          requested_sessionIds:
            auditQueryRequestDetails.requested_sessionIds ?? '',
          requested_journeyIds:
            auditQueryRequestDetails.requested_journeyIds ?? '',
          requested_userIds: auditQueryRequestDetails.requested_userIds ?? '',
          requested_eventIds: auditQueryRequestDetails.requested_eventIds ?? '',
          piiTypes: auditQueryRequestDetails.piiTypes,
          dataPaths: auditQueryRequestDetails.dataPaths
        }
      }
    }

    console.log('sending audit data request message', auditQueryRequestDetails)
    await sendSqsMessage(
      auditDataRequestEvent,
      getEnv('AUDIT_DATA_REQUEST_EVENTS_QUEUE_URL')
    )
  } catch (error) {
    console.error(
      'An error occurred while sending message to audit queue: ',
      error
    )
  }
}

export const sendIllegalRequestAuditMessage = async (
  zendeskId: string | undefined,
  errorType: ErrorType
) => {
  try {
    const auditQueryIllegalRequestDetails: AuditEventType = {
      event_name: 'TXMA_AUDIT_QUERY_ILLEGAL_REQUEST',
      ...createAuditMessageBaseObjectDetails(zendeskId)
    }
    auditQueryIllegalRequestDetails.extensions.error = getErrorObject(errorType)

    console.log(
      'sending illegal request audit message for zendeskId ',
      zendeskId
    )
    await sendSqsMessage(
      auditQueryIllegalRequestDetails,
      getEnv('AUDIT_DATA_REQUEST_EVENTS_QUEUE_URL')
    )
  } catch (error) {
    console.error(
      'An error occurred while sending message to audit queue: ',
      error
    )
  }
}

export const sendQueryOutputGeneratedAuditMessage = async (
  zendeskId: string
) => {
  try {
    const queryOutputGeneratedAuditMessageDetails: AuditEventType = {
      event_name: 'TXMA_AUDIT_QUERY_OUTPUT_GENERATED',
      ...createAuditMessageBaseObjectDetails(zendeskId)
    }

    console.log(
      'sending query output generated message for zendeskId ',
      zendeskId
    )
    await sendSqsMessage(
      queryOutputGeneratedAuditMessageDetails,
      getEnv('AUDIT_DATA_REQUEST_EVENTS_QUEUE_URL')
    )
  } catch (error) {
    console.error(
      'An error occurred while sending message to audit queue: ',
      error
    )
  }
}

const createAuditMessageBaseObjectDetails = (zendeskId?: string) => {
  const baseObject = {
    timestamp: currentDateEpochMilliseconds(),
    component_id: 'TXMA' as ComponentId,
    extensions: {
      ticket_details: {
        zendeskId: ''
      }
    }
  }
  if (zendeskId) baseObject.extensions.ticket_details.zendeskId = zendeskId

  return baseObject
}

const getErrorObject = (errorType: ErrorType): ErrorObject => {
  const errorDetails: Record<ErrorType, ErrorObject> = {
    'invalid-signature': {
      error_type: 'invalid-signature',
      error_description:
        'The webhook signature check failed, probably indicating that the request did not come from Zendesk'
    },

    'mismatched-ticket': {
      error_type: 'mismatched-ticket',
      error_description:
        'There is a ticket for the given Zendesk ID, but some of its details are mismatched'
    },

    'non-existent-ticket': {
      error_type: 'non-existent-ticket',
      error_description: 'There is no ticket for the given Zendesk ID'
    }
  }

  return errorDetails[errorType]
}
