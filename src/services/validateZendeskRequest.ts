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
    isValid: true
  }
}
