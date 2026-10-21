export interface DataRequestParams {
  zendeskId: string
  requesterEmail: string
  requesterName: string
  recipientEmail: string
  recipientName: string
  dateFrom: string
  dateTo: string
  identifierType: IdentifierTypes
  sessionIds: string[]
  journeyIds: string[]
  eventIds: string[]
  userIds: string[]
  piiTypes: string[]
  dataPaths: string[]
}

export type IdentifierTypes =
  | 'event_id'
  | 'session_id'
  | 'journey_id'
  | 'user_id'
