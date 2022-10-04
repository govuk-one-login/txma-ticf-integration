import { DataRequestParams } from '../../types/dataRequestParams'
import {
  TEST_DATE_FROM,
  TEST_DATE_TO,
  TEST_RECIPIENT_EMAIL,
  TEST_RECIPIENT_NAME,
  ZENDESK_TICKET_ID
} from './testConstants'

export const testDataRequest = {
  zendeskId: ZENDESK_TICKET_ID,
  resultsEmail: TEST_RECIPIENT_EMAIL,
  resultsName: TEST_RECIPIENT_NAME,
  dateFrom: TEST_DATE_FROM,
  dateTo: TEST_DATE_TO,
  identifierType: 'event_id',
  eventIds: ['123', '456'],
  piiTypes: ['passport_number'],
  journeyIds: [],
  sessionIds: [],
  dataPaths: [],
  userIds: []
} as DataRequestParams
