import { ValidatedDataRequestParamsResult } from '../types/validatedDataRequestParamsResult'

export const validateZendeskRequest = (
  body: string | null
): ValidatedDataRequestParamsResult => {
  console.log(body)
  return {
    dataRequestParams: {
      zendeskTicketId: '123'
    },
    isValid: true
  }
}
