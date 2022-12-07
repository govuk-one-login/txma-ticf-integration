// constants are WIP
import {
  END_TO_END_TEST_DATA_PATH,
  END_TO_END_TEST_DATE,
  END_TO_END_TEST_EVENT_ID,
  END_TO_END_TEST_JOURNEY_ID,
  END_TO_END_TEST_SESSION_ID,
  END_TO_END_TEST_USER_ID,
  INTEGRATION_TEST_DATE_GLACIER,
  INTEGRATION_TEST_DATE_MIX_DATA,
  INTEGRATION_TEST_DATE_NO_DATA,
  TEST_DATA_DATA_PATHS,
  TEST_DATA_EVENT_ID
} from '../../../../utils/constants/generalConstants'
import {
  RECIPIENT_EMAIL,
  RECIPIENT_NAME,
  REQUESTER_EMAIL,
  ZENDESK_END_USER_NAME
} from '../../../../utils/constants/userConstants'
import { ZendeskWebhookRequest } from '../../../integration-tests/types/zendeskWebhookRequest'
import { generateZendeskRequestDate } from '../../utils/helpers'

const createUniqueTicketIdWithMappingSuffix = (mappingId: number) => {
  return Date.now().toString() + mappingId
}

export const ticketIdToResponseMapping: {
  [key: number]: ZendeskWebhookRequest
} = {
  // dataCopyRequestData.validRequestData
  1: {
    zendeskId: createUniqueTicketIdWithMappingSuffix(1),
    requesterEmail: REQUESTER_EMAIL,
    requesterName: ZENDESK_END_USER_NAME,
    recipientEmail: RECIPIENT_EMAIL,
    recipientName: RECIPIENT_NAME,
    dateFrom: '2022-01-01',
    dateTo: '2022-01-01',
    identifierType: 'event_id',
    sessionIds: '',
    journeyIds: '',
    userIds: '',
    eventIds: TEST_DATA_EVENT_ID,
    piiTypes: 'drivers_license',
    dataPaths:
      'restricted.this1.that1 restricted.this2.that2 restricted.this3.that3.those3'
  },
  // invalidRequestData: Date in future
  2: {
    zendeskId: createUniqueTicketIdWithMappingSuffix(2),
    requesterEmail: REQUESTER_EMAIL,
    requesterName: ZENDESK_END_USER_NAME,
    recipientEmail: RECIPIENT_EMAIL,
    recipientName: RECIPIENT_NAME,
    dateFrom: generateZendeskRequestDate(1),
    dateTo: generateZendeskRequestDate(1),
    identifierType: 'event_id',
    sessionIds: '',
    journeyIds: '',
    userIds: '',
    eventIds: TEST_DATA_EVENT_ID,
    piiTypes: 'drivers_license',
    dataPaths: ''
  },
  // validGlacierRequestData
  3: {
    zendeskId: createUniqueTicketIdWithMappingSuffix(3),
    requesterEmail: REQUESTER_EMAIL,
    requesterName: ZENDESK_END_USER_NAME,
    recipientEmail: RECIPIENT_EMAIL,
    recipientName: RECIPIENT_NAME,
    dateFrom: INTEGRATION_TEST_DATE_GLACIER,
    dateTo: INTEGRATION_TEST_DATE_GLACIER,
    identifierType: 'event_id',
    sessionIds: '',
    journeyIds: '',
    userIds: '',
    eventIds: TEST_DATA_EVENT_ID,
    piiTypes: 'drivers_license',
    dataPaths: ''
  },
  // validStandardAndGlacierTiersRequestData
  4: {
    zendeskId: createUniqueTicketIdWithMappingSuffix(4),
    requesterEmail: REQUESTER_EMAIL,
    requesterName: ZENDESK_END_USER_NAME,
    recipientEmail: RECIPIENT_EMAIL,
    recipientName: RECIPIENT_NAME,
    dateFrom: INTEGRATION_TEST_DATE_MIX_DATA,
    dateTo: INTEGRATION_TEST_DATE_MIX_DATA,
    identifierType: 'event_id',
    sessionIds: '',
    journeyIds: '',
    userIds: '',
    eventIds: TEST_DATA_EVENT_ID,
    piiTypes: 'drivers_license',
    dataPaths: ''
  },
  // validRequestNoData
  5: {
    zendeskId: createUniqueTicketIdWithMappingSuffix(5),
    requesterEmail: REQUESTER_EMAIL,
    requesterName: ZENDESK_END_USER_NAME,
    recipientEmail: RECIPIENT_EMAIL,
    recipientName: RECIPIENT_NAME,
    dateFrom: INTEGRATION_TEST_DATE_NO_DATA,
    dateTo: INTEGRATION_TEST_DATE_NO_DATA,
    identifierType: 'event_id',
    sessionIds: '',
    journeyIds: '',
    userIds: '',
    eventIds: TEST_DATA_EVENT_ID,
    piiTypes: '',
    dataPaths: ''
  },
  // endToEndFlowRequestData.endToEndFlowRequestDataWithEventId
  6: {
    zendeskId: createUniqueTicketIdWithMappingSuffix(6),
    requesterEmail: REQUESTER_EMAIL,
    requesterName: ZENDESK_END_USER_NAME,
    recipientEmail: RECIPIENT_EMAIL,
    recipientName: RECIPIENT_NAME,
    dateFrom: END_TO_END_TEST_DATE,
    dateTo: END_TO_END_TEST_DATE,
    identifierType: 'event_id',
    sessionIds: '',
    journeyIds: '',
    userIds: '',
    eventIds: END_TO_END_TEST_EVENT_ID,
    piiTypes: '',
    dataPaths: END_TO_END_TEST_DATA_PATH
  },
  // endToEndFlowRequestData.endToEndFlowRequestDataWithUserId
  7: {
    zendeskId: createUniqueTicketIdWithMappingSuffix(7),
    requesterEmail: REQUESTER_EMAIL,
    requesterName: ZENDESK_END_USER_NAME,
    recipientEmail: RECIPIENT_EMAIL,
    recipientName: RECIPIENT_NAME,
    dateFrom: END_TO_END_TEST_DATE,
    dateTo: END_TO_END_TEST_DATE,
    identifierType: 'user_id',
    sessionIds: '',
    journeyIds: '',
    userIds: END_TO_END_TEST_USER_ID,
    eventIds: END_TO_END_TEST_EVENT_ID,
    piiTypes: 'passport_number passport_expiry_date',
    dataPaths: ''
  },
  // endToEndFlowRequestDataWithSessionId
  8: {
    zendeskId: createUniqueTicketIdWithMappingSuffix(8),
    requesterEmail: REQUESTER_EMAIL,
    requesterName: ZENDESK_END_USER_NAME,
    recipientEmail: RECIPIENT_EMAIL,
    recipientName: RECIPIENT_NAME,
    dateFrom: END_TO_END_TEST_DATE,
    dateTo: END_TO_END_TEST_DATE,
    identifierType: 'session_id',
    sessionIds: END_TO_END_TEST_SESSION_ID,
    journeyIds: '',
    userIds: '',
    eventIds: '',
    piiTypes: 'name dob addresses',
    dataPaths: ''
  },
  // endToEndFlowRequestDataWithJourneyId
  9: {
    zendeskId: createUniqueTicketIdWithMappingSuffix(9),
    requesterEmail: REQUESTER_EMAIL,
    requesterName: ZENDESK_END_USER_NAME,
    recipientEmail: RECIPIENT_EMAIL,
    recipientName: RECIPIENT_NAME,
    dateFrom: END_TO_END_TEST_DATE,
    dateTo: END_TO_END_TEST_DATE,
    identifierType: 'journey_id',
    sessionIds: '',
    journeyIds: END_TO_END_TEST_JOURNEY_ID,
    userIds: '',
    eventIds: '',
    piiTypes: 'drivers_license',
    dataPaths: ''
  },
  // endToEndFlowRequestDataNoMatch
  10: {
    zendeskId: createUniqueTicketIdWithMappingSuffix(10),
    requesterEmail: REQUESTER_EMAIL,
    requesterName: ZENDESK_END_USER_NAME,
    recipientEmail: RECIPIENT_EMAIL,
    recipientName: RECIPIENT_NAME,
    dateFrom: END_TO_END_TEST_DATE,
    dateTo: END_TO_END_TEST_DATE,
    identifierType: 'event_id',
    sessionIds: '',
    journeyIds: '',
    userIds: '',
    eventIds: 'zzzzzzzz-yyyy-aaaa-bbbb-cccccccccccc',
    piiTypes: 'drivers_license',
    dataPaths: END_TO_END_TEST_DATA_PATH
  },
  // webhookAPIRequestData.validApiTestRequestData
  11: {
    zendeskId: createUniqueTicketIdWithMappingSuffix(11),
    requesterEmail: REQUESTER_EMAIL,
    requesterName: ZENDESK_END_USER_NAME,
    recipientEmail: RECIPIENT_EMAIL,
    recipientName: RECIPIENT_NAME,
    dateFrom: END_TO_END_TEST_DATE,
    dateTo: END_TO_END_TEST_DATE,
    identifierType: 'event_id',
    sessionIds: '',
    journeyIds: '',
    userIds: '',
    eventIds: TEST_DATA_EVENT_ID,
    piiTypes: 'drivers_license',
    dataPaths: TEST_DATA_DATA_PATHS
  }
}
