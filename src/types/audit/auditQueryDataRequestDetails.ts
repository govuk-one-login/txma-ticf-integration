export interface AuditQueryDataRequestDetails {
  requesterEmail: string
  requesterName: string
  recipientEmail: string
  recipientName: string
  zendeskId: string
  dateFrom?: string
  dateTo?: string
  dates?: string
  identifierType: string
  requested_sessionIds: string
  requested_journeyIds: string
  requested_userIds: string
  requested_eventIds: string
  piiTypes: string
  dataPaths: string
}
