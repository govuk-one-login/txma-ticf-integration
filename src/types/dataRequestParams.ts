export type IdentifierTypes =
  | 'event_id'
  | 'session_id'
  | 'journey_id'
  | 'user_id'

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

export const isDataRequestParams = (arg: unknown): arg is DataRequestParams => {
  const test = arg as DataRequestParams
  return (
    typeof test?.zendeskId === 'string' &&
    typeof test?.recipientEmail === 'string' &&
    typeof test?.recipientName === 'string' &&
    typeof test?.requesterEmail === 'string' &&
    typeof test?.requesterName === 'string' &&
    typeof test?.dateFrom === 'string' &&
    typeof test?.dateTo === 'string' &&
    typeof test?.identifierType === 'string'
  )
}
