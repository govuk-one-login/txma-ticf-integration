import {
  AuditEventType,
  ErrorType,
  ErrorObject,
  ComponentId
} from '../../types/audit/auditEventDetails'
import { AuditQueryDataRequestDetails } from '../../types/audit/auditQueryDataRequestDetails'
import { currentDateEpochSeconds } from '../../utils/currentDateEpochSeconds'
import { getEnv } from '../../utils/helpers'
import { logger } from '../logger'
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
          dates: auditQueryRequestDetails.dates,
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

    const messageId = await sendSqsMessage(
      auditDataRequestEvent,
      getEnv('AUDIT_DATA_REQUEST_EVENTS_QUEUE_URL')
    )
    logger.info('sent audit data request message', { messageId })
  } catch (error) {
    logger.error(
      'An error occurred while sending message to audit queue: ',
      error as Error
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

    const messageId = await sendSqsMessage(
      auditQueryIllegalRequestDetails,
      getEnv('AUDIT_DATA_REQUEST_EVENTS_QUEUE_URL')
    )
    logger.info('Sent TXMA_AUDIT_QUERY_ILLEGAL_REQUEST event', { messageId })
  } catch (error) {
    logger.error(
      'An error occurred while sending message to audit queue: ',
      error as Error
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

    const messageId = await sendSqsMessage(
      queryOutputGeneratedAuditMessageDetails,
      getEnv('AUDIT_DATA_REQUEST_EVENTS_QUEUE_URL')
    )
    logger.info('Sent TXMA_AUDIT_QUERY_OUTPUT_GENERATED event', { messageId })
  } catch (error) {
    logger.error(
      'An error occurred while sending message to audit queue: ',
      error as Error
    )
  }
}

const createAuditMessageBaseObjectDetails = (zendeskId?: string) => {
  const baseObject = {
    timestamp: currentDateEpochSeconds(),
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
