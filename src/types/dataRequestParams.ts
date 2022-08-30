export interface DataRequestParams {
  dataPaths: string | null
  dateFrom: string
  dateTo: string
  eventIds: string | null
  identifierType: string
  journeyIds: string | null
  piiTypes: string | null
  resultsEmail: string
  resultsName: string
  sessionIds: string | null
  zendeskTicketId: string | null
}
