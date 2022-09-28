import { DataRequestParams } from '../../types/dataRequestParams'
import {
  TEST_DATE_FROM,
  TEST_DATE_TO,
  ZENDESK_TICKET_ID
} from './testConstants'

export const testDataRequest = {
  zendeskId: ZENDESK_TICKET_ID,
  resultsEmail: 'myuser@test.gov.uk',
  resultsName: 'my name',
  dateFrom: TEST_DATE_FROM,
  dateTo: TEST_DATE_TO,
  identifierType: 'event_id',
  eventIds: ['123', '456'],
  piiTypes: ['passport_number']
} as DataRequestParams

export const noEventIdTestDataRequest = {
  zendeskId: ZENDESK_TICKET_ID,
  resultsEmail: 'myuser@test.gov.uk',
  resultsName: 'my name',
  dateFrom: TEST_DATE_FROM,
  dateTo: TEST_DATE_TO,
  identifierType: 'event_id',
  piiTypes: ['passport_number']
} as DataRequestParams
