export type IdentifierTypes = 'event_id' | 'session_id' | 'journey_id'

export interface DataRequestParams {
  zendeskId: string
  resultsEmail: string
  resultsName: string
  dateFrom: string
  dateTo: string
  identifierType: IdentifierTypes
  sessionIds?: string
  journeyIds?: string
  eventIds?: string
  piiTypes?: string
  dataPaths?: string
}
