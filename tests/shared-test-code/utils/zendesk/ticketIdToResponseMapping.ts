import {
  END_TO_END_TEST_DATE,
  END_TO_END_TEST_EVENT_ID,
  END_TO_END_TEST_DATA_PATH,
  END_TO_END_TEST_USER_ID,
  END_TO_END_TEST_SESSION_ID,
  END_TO_END_TEST_JOURNEY_ID
} from '../../../e2e-tests/constants/testData'
import {
  TEST_DATA_EVENT_ID,
  TEST_DATA_DATA_PATHS,
  INTEGRATION_TEST_DATE_GLACIER,
  INTEGRATION_TEST_DATE_MIX_DATA,
  INTEGRATION_TEST_DATE_NO_DATA
} from '../../../integration-tests/constants/testData'
import {
  ZENDESK_REQUESTER_EMAIL,
  ZENDESK_REQUESTER_NAME,
  ZENDESK_RECIPIENT_EMAIL,
  ZENDESK_RECIPIENT_NAME
} from '../../constants/zendeskParameters'
import { ZendeskWebhookRequest } from '../../types/zendeskWebhookRequest'
import { generateZendeskRequestDate } from '../helpers'

const createUniqueTicketIdWithMappingSuffix = (mappingId: number) => {
  return Date.now().toString() + 0 + mappingId
}

export const ticketIdToResponseMapping: {
  [key: number]: ZendeskWebhookRequest
} = {
  // dataCopyRequestData.validRequestData
  1: {
    zendeskId: createUniqueTicketIdWithMappingSuffix(1),
    requesterEmail: ZENDESK_REQUESTER_EMAIL,
    requesterName: ZENDESK_REQUESTER_NAME,
    recipientEmail: ZENDESK_RECIPIENT_EMAIL,
    recipientName: ZENDESK_RECIPIENT_NAME,
    dateFrom: '2022-01-01',
    dateTo: '2022-01-01',
    identifierType: 'event_id',
    sessionIds: '',
    journeyIds: '',
    userIds: '',
    eventIds: TEST_DATA_EVENT_ID,
    piiTypes: 'drivers_license',
    dataPaths: TEST_DATA_DATA_PATHS
  },
  // invalidRequestData: Date in future
  2: {
    zendeskId: createUniqueTicketIdWithMappingSuffix(2),
    requesterEmail: ZENDESK_REQUESTER_EMAIL,
    requesterName: ZENDESK_REQUESTER_NAME,
    recipientEmail: ZENDESK_RECIPIENT_EMAIL,
    recipientName: ZENDESK_RECIPIENT_NAME,
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
    requesterEmail: ZENDESK_REQUESTER_EMAIL,
    requesterName: ZENDESK_REQUESTER_NAME,
    recipientEmail: ZENDESK_RECIPIENT_EMAIL,
    recipientName: ZENDESK_RECIPIENT_NAME,
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
    requesterEmail: ZENDESK_REQUESTER_EMAIL,
    requesterName: ZENDESK_REQUESTER_NAME,
    recipientEmail: ZENDESK_RECIPIENT_EMAIL,
    recipientName: ZENDESK_RECIPIENT_NAME,
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
    requesterEmail: ZENDESK_REQUESTER_EMAIL,
    requesterName: ZENDESK_REQUESTER_NAME,
    recipientEmail: ZENDESK_RECIPIENT_EMAIL,
    recipientName: ZENDESK_RECIPIENT_NAME,
    dateFrom: INTEGRATION_TEST_DATE_NO_DATA,
    dateTo: INTEGRATION_TEST_DATE_NO_DATA,
    identifierType: 'event_id',
    sessionIds: '',
    journeyIds: '',
    userIds: '',
    eventIds: TEST_DATA_EVENT_ID,
    piiTypes: 'drivers_license',
    dataPaths: ''
  },
  // endToEndFlowRequestData.endToEndFlowRequestDataWithEventId
  6: {
    zendeskId: createUniqueTicketIdWithMappingSuffix(6),
    requesterEmail: ZENDESK_REQUESTER_EMAIL,
    requesterName: ZENDESK_REQUESTER_NAME,
    recipientEmail: ZENDESK_RECIPIENT_EMAIL,
    recipientName: ZENDESK_RECIPIENT_NAME,
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
    requesterEmail: ZENDESK_REQUESTER_EMAIL,
    requesterName: ZENDESK_REQUESTER_NAME,
    recipientEmail: ZENDESK_RECIPIENT_EMAIL,
    recipientName: ZENDESK_RECIPIENT_NAME,
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
    requesterEmail: ZENDESK_REQUESTER_EMAIL,
    requesterName: ZENDESK_REQUESTER_NAME,
    recipientEmail: ZENDESK_RECIPIENT_EMAIL,
    recipientName: ZENDESK_RECIPIENT_NAME,
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
    requesterEmail: ZENDESK_REQUESTER_EMAIL,
    requesterName: ZENDESK_REQUESTER_NAME,
    recipientEmail: ZENDESK_RECIPIENT_EMAIL,
    recipientName: ZENDESK_RECIPIENT_NAME,
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
    requesterEmail: ZENDESK_REQUESTER_EMAIL,
    requesterName: ZENDESK_REQUESTER_NAME,
    recipientEmail: ZENDESK_RECIPIENT_EMAIL,
    recipientName: ZENDESK_RECIPIENT_NAME,
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
    requesterEmail: ZENDESK_REQUESTER_EMAIL,
    requesterName: ZENDESK_REQUESTER_NAME,
    recipientEmail: ZENDESK_RECIPIENT_EMAIL,
    recipientName: ZENDESK_RECIPIENT_NAME,
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
