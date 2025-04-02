import { AuditQueryDataRequestDetails } from '../../../common/types/audit/auditQueryDataRequestDetails'

export type ComponentId = 'TXMA'
export type EventName =
  | 'TXMA_AUDIT_QUERY_DATA_REQUEST'
  | 'TXMA_AUDIT_QUERY_ILLEGAL_REQUEST'
  | 'TXMA_AUDIT_QUERY_OUTPUT_GENERATED'
export type ErrorType =
  | 'invalid-signature'
  | 'mismatched-ticket'
  | 'non-existent-ticket'
export interface ErrorObject {
  error_type: ErrorType
  error_description: string
}
export interface AuditEventType {
  timestamp: number
  event_name: EventName
  component_id: ComponentId
  restricted?: {
    requesterEmail: string
    requesterName: string
    recipientEmail: string
    recipientName: string
  }
  extensions: {
    error?: ErrorObject
    ticket_details: Partial<AuditQueryDataRequestDetails>
  }
}
