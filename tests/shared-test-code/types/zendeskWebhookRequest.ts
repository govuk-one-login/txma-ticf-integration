export interface ZendeskTicketTestData {
  recipientEmail: string
  recipientName: string
  requesterEmail: string
  requesterName: string
  identifierType: string
  eventIds: string
  piiTypes: string
  sessionIds: string
  journeyIds: string
  userIds: string
  dataPaths: string
}

export interface ZendeskWebhookRequest extends ZendeskTicketTestData {
  zendeskId: string
  dateFrom: string
  dateTo: string
}
