export type IdentifierTypes =
  | 'event_id'
  | 'session_id'
  | 'journey_id'
  | 'user_id'

export interface DataRequestParams {
  zendeskId: string
  resultsEmail: string
  resultsName: string
  dateFrom: string
  dateTo: string
  identifierType: IdentifierTypes
  sessionIds?: string[]
  journeyIds?: string[]
  eventIds?: string[]
  userIds?: string[]
  piiTypes?: string[]
  dataPaths?: string[]
}
