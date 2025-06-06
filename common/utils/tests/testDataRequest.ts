import { DataRequestParams } from '../../../common/types/dataRequestParams'
import {
  TEST_DATE_1,
  TEST_DATE_2,
  TEST_RECIPIENT_EMAIL,
  TEST_RECIPIENT_NAME,
  TEST_REQUESTER_EMAIL,
  TEST_REQUESTER_NAME,
  ZENDESK_TICKET_ID
} from './testConstants'

export const testDataRequest = {
  zendeskId: ZENDESK_TICKET_ID,
  recipientEmail: TEST_RECIPIENT_EMAIL,
  recipientName: TEST_RECIPIENT_NAME,
  requesterEmail: TEST_REQUESTER_EMAIL,
  requesterName: TEST_REQUESTER_NAME,
  dates: [TEST_DATE_1, TEST_DATE_2],
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
  recipientEmail: 'myuser@example.com',
  recipientName: 'my name',
  requesterEmail: 'myuser@example.com',
  requesterName: 'my name',
  dates: [TEST_DATE_1, TEST_DATE_2],
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
  recipientEmail: 'myuser@example.com',
  recipientName: 'my name',
  requesterEmail: 'myuser@example.com',
  requesterName: 'my name',
  dates: [TEST_DATE_1, TEST_DATE_2],
  identifierType: 'event_id',
  eventIds: [],
  journeyIds: [],
  piiTypes: [],
  sessionIds: [],
  userIds: [],
  dataPaths: []
} as DataRequestParams

export const noIdTestDataRequest = {
  zendeskId: ZENDESK_TICKET_ID,
  recipientEmail: 'myuser@example.com',
  recipientName: 'my name',
  requesterEmail: 'myuser@example.com',
  requesterName: 'my name',
  dates: [TEST_DATE_1, TEST_DATE_2],
  identifierType: 'event_id',
  eventIds: [],
  userIds: [],
  journeyIds: [],
  sessionIds: [],
  dataPaths: [],
  piiTypes: ['passport_number']
} as DataRequestParams

export const dataPathsTestDataRequest = {
  zendeskId: ZENDESK_TICKET_ID,
  recipientEmail: 'myuser@example.com',
  recipientName: 'my name',
  requesterEmail: 'myuser@example.com',
  requesterName: 'my name',
  dates: [TEST_DATE_1],
  identifierType: 'event_id',
  eventIds: ['123e', '456e'],
  sessionIds: ['123s', '456s'],
  userIds: ['123u', '456u'],
  journeyIds: ['123j', '456j'],
  dataPaths: ['restricted.user.firstName', 'restricted.user.lastName'],
  piiTypes: []
} as DataRequestParams

export const testDataRequestWithNoDataPathsOrPiiTypes = {
  zendeskId: ZENDESK_TICKET_ID,
  recipientEmail: 'myuser@example.com',
  recipientName: 'my name',
  requesterEmail: 'myuser@example.com',
  requesterName: 'my name',
  dates: [TEST_DATE_1],
  dataPaths: [],
  identifierType: 'event_id',
  eventIds: ['123', '456'],
  journeyIds: ['123', '456'],
  piiTypes: [],
  sessionIds: ['123', '456'],
  userIds: ['123', '456']
} as DataRequestParams
