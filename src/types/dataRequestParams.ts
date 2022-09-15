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

export const isDataRequestParams = (arg: unknown): arg is DataRequestParams => {
  const test = arg as DataRequestParams
  return (
    typeof test?.zendeskId === 'string' &&
    typeof test?.resultsEmail === 'string' &&
    typeof test?.resultsName === 'string' &&
    typeof test?.dateFrom === 'string' &&
    typeof test?.dateTo === 'string' &&
    typeof test?.identifierType === 'string'
  )
}
