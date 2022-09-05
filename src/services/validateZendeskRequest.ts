import { ValidatedDataRequestParamsResult } from '../types/validatedDataRequestParamsResult'

export const validateZendeskRequest = (
  body: string | null
): ValidatedDataRequestParamsResult => {
  console.log(body)
  return {
    dataRequestParams: {
      dateFrom: '2022/10/10',
      dateTo: '2022/10/10',
      zendeskTicketId: '1234'
    },
    // this is a temporary line for testing updateZendeskTicket
    // before validateZendeskRequest is implemented
    isValid: body !== null && !body.includes('resultsEmail')
  }
}
