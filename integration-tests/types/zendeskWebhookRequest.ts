export type ZendeskWebhookRequest = {
  zendeskId: string
  recipientEmail: string
  recipientName: string
  requesterEmail: string
  requesterName: string
  dateFrom: string
  dateTo: string
  identifierType: string
  eventIds: string
  piiTypes: string
  sessionIds: string
  journeyIds: string
  userIds: string
  dataPaths: string
}
