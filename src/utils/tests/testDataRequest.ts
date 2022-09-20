import { DataRequestParams } from '../../types/dataRequestParams'
import { ZENDESK_TICKET_ID } from './testConstants'

export const testDataRequest = {
  zendeskId: ZENDESK_TICKET_ID,
  resultsEmail: 'myuser@test.gov.uk',
  resultsName: 'my name',
  dateFrom: '2021-08-21',
  dateTo: '2021-08-21',
  identifierType: 'event_id',
  eventIds: ['123', '456'],
  piiTypes: ['passport_number']
} as DataRequestParams
