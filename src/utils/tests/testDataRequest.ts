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
  piiTypes: ['passport_number'],
  dataPaths: [],
  journeyIds: [],
  sessionIds: [],
  userIds: []
} as DataRequestParams

export const testDataRequestWithAllValuesSet = {
  zendeskId: ZENDESK_TICKET_ID,
  resultsEmail: 'myuser@test.gov.uk',
  resultsName: 'my name',
  dateFrom: TEST_DATE_FROM,
  dateTo: TEST_DATE_TO,
  dataPaths: ['path_to_data1', 'path_to_data2'],
  identifierType: 'event_id',
  eventIds: ['123', '456'],
  journeyIds: ['123', '456'],
  piiTypes: ['passport_number'],
  sessionIds: ['123', '456'],
  userIds: ['123', '456']
} as DataRequestParams

export const testDataRequestWithEmptyValuesForIds = {
  zendeskId: ZENDESK_TICKET_ID,
  resultsEmail: 'myuser@test.gov.uk',
  resultsName: 'my name',
  dateFrom: TEST_DATE_FROM,
  dateTo: TEST_DATE_TO,
  identifierType: 'event_id',
  eventIds: [],
  journeyIds: [],
  piiTypes: [],
  sessionIds: [],
  userIds: [],
  dataPaths: []
} as DataRequestParams
