import { DataRequestParams } from './dataRequestParams'

export interface QueryRequestDBParams extends DataRequestParams {
  athenaQueryId?: string
}

export const isQueryRequestDBParams = (
  arg: unknown
): arg is QueryRequestDBParams => {
  const test = arg as QueryRequestDBParams
  return (
    typeof test?.zendeskId === 'string' &&
    typeof test?.recipientEmail === 'string' &&
    typeof test?.recipientName === 'string' &&
    typeof test?.requesterEmail === 'string' &&
    typeof test?.requesterName === 'string' &&
    // TODO: add a check for the "dates" property
    typeof test?.identifierType === 'string'
  )
}
