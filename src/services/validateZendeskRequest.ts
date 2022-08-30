import { ValidatedDataRequestParamsResult } from '../types/validatedDataRequestParamsResult'

export const validateZendeskRequest = (
  body: string | null
): ValidatedDataRequestParamsResult => {
  console.log(body)
  return {
    dataRequestParams: {
      dataPaths: null,
      dateFrom: '2022/10/10',
      dateTo: '2022/10/10',
      eventIds: '1234',
      identifierType: 'eventId',
      journeyIds: null,
      piiTypes: null,
      resultsEmail: 'example@example.com',
      resultsName: 'example',
      sessionIds: null,
      zendeskTicketId: '1234'
    },
    isValid: true
  }
}
