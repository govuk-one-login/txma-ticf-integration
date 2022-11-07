import { AuditQueryDataRequestDetails } from '../../types/audit/auditQueryDataRequestDetails'
import { getEnv } from '../../utils/helpers'
import { sendSqsMessage } from './sendSqsMessage'

export const sendAuditDataRequestMessage = async (
  auditQueryRequestDetails: AuditQueryDataRequestDetails
) => {
  try {
    const auditDataRequestEvent = {
      timestamp: Date.now(),
      event_name: 'TXMA_AUDIT_QUERY_DATA_REQUEST',
      component_id: 'TXMA',
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

export const sendIllegalRequestAuditMessage = async (zendeskId: string) => {
  try {
    const auditQueryIllegalRequestDetails = {
      timestamp: Date.now(),
      event_name: 'TXMA_AUDIT_QUERY_ILLEGAL_REQUEST',
      component_id: 'TXMA',
      extensions: {
        ticket_details: {
          zendeskId: zendeskId
        }
      }
    }

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
    const queryOutputGeneratedAuditMessageDetails = {
      timestamp: Date.now(),
      event_name: 'TXMA_AUDIT_QUERY_OUTPUT_GENERATED',
      component_id: 'TXMA',
      extensions: {
        ticket_details: {
          zendeskId: zendeskId
        }
      }
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
