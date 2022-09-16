import { DataRequestParams } from '../../types/dataRequestParams'

export const testDataRequest = {
  zendeskId: '123',
  resultsEmail: 'myuser@test.gov.uk',
  resultsName: 'my name',
  dateFrom: '2021-08-21',
  dateTo: '2021-08-21',
  identifierType: 'event_id',
  eventIds: ['123', '456'],
  piiTypes: ['passport_number']
} as DataRequestParams
