export interface ManualAuditDataRequestPayload {
  zendeskId: string
  dates: string[]
  requesterEmail: string
  requesterName: string
  recipientEmail: string
  recipientName: string
  identifierType: string
  sessionIds: string[]
  journeyIds: string[]
  eventIds: string[]
  userIds: string[]
  piiTypes: string[]
  dataPaths: string[]
}
