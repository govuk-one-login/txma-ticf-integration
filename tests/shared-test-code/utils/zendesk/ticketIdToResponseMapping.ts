// import {
//   END_TO_END_TEST_EVENT_ID,
//   END_TO_END_TEST_DATA_PATH,
//   END_TO_END_TEST_USER_ID,
//   END_TO_END_TEST_SESSION_ID,
//   END_TO_END_TEST_JOURNEY_ID
// } from '../../../e2e-tests/constants/testData'
import { testData } from '../../../integration-tests/constants/testData'
import {
  ZENDESK_REQUESTER_EMAIL,
  ZENDESK_REQUESTER_NAME,
  ZENDESK_RECIPIENT_EMAIL,
  ZENDESK_RECIPIENT_NAME
} from '../../constants/zendeskParameters'
import { ZendeskTicketTestData } from '../../types/zendeskWebhookRequest'

export const zendeskTicketTestCaseMapping: {
  [key: number]: ZendeskTicketTestData
} = {
  // dataCopyRequestData.validRequestData
  1: {
    requesterEmail: ZENDESK_REQUESTER_EMAIL,
    requesterName: ZENDESK_REQUESTER_NAME,
    recipientEmail: ZENDESK_RECIPIENT_EMAIL,
    recipientName: ZENDESK_RECIPIENT_NAME,
    identifierType: 'event_id',
    sessionIds: '',
    journeyIds: '',
    userIds: '',
    eventIds: testData.eventId,
    piiTypes: 'drivers_license',
    dataPaths:
      'restricted.this1.that1 restricted.this2.that2 restricted.this3.that3.those3'
  },
  // invalidRequestData: Date in future
  2: {
    requesterEmail: ZENDESK_REQUESTER_EMAIL,
    requesterName: ZENDESK_REQUESTER_NAME,
    recipientEmail: ZENDESK_RECIPIENT_EMAIL,
    recipientName: ZENDESK_RECIPIENT_NAME,
    identifierType: 'event_id',
    sessionIds: '',
    journeyIds: '',
    userIds: '',
    eventIds: testData.eventId,
    piiTypes: 'drivers_license',
    dataPaths: ''
  },
  // validGlacierRequestData
  3: {
    requesterEmail: ZENDESK_REQUESTER_EMAIL,
    requesterName: ZENDESK_REQUESTER_NAME,
    recipientEmail: ZENDESK_RECIPIENT_EMAIL,
    recipientName: ZENDESK_RECIPIENT_NAME,
    identifierType: 'event_id',
    sessionIds: '',
    journeyIds: '',
    userIds: '',
    eventIds: testData.eventId,
    piiTypes: 'drivers_license',
    dataPaths: ''
  },
  // validStandardAndGlacierTiersRequestData
  4: {
    requesterEmail: ZENDESK_REQUESTER_EMAIL,
    requesterName: ZENDESK_REQUESTER_NAME,
    recipientEmail: ZENDESK_RECIPIENT_EMAIL,
    recipientName: ZENDESK_RECIPIENT_NAME,
    identifierType: 'event_id',
    sessionIds: '',
    journeyIds: '',
    userIds: '',
    eventIds: testData.eventId,
    piiTypes: 'drivers_license',
    dataPaths: ''
  },
  // validRequestNoData
  5: {
    requesterEmail: ZENDESK_REQUESTER_EMAIL,
    requesterName: ZENDESK_REQUESTER_NAME,
    recipientEmail: ZENDESK_RECIPIENT_EMAIL,
    recipientName: ZENDESK_RECIPIENT_NAME,
    identifierType: 'event_id',
    sessionIds: '',
    journeyIds: '',
    userIds: '',
    eventIds: testData.eventId,
    piiTypes: 'drivers_license',
    dataPaths: ''
  },
  // // endToEndFlowRequestData.endToEndFlowRequestDataWithEventId
  // 6: {
  //   requesterEmail: ZENDESK_REQUESTER_EMAIL,
  //   requesterName: ZENDESK_REQUESTER_NAME,
  //   recipientEmail: ZENDESK_RECIPIENT_EMAIL,
  //   recipientName: ZENDESK_RECIPIENT_NAME,
  //   identifierType: 'event_id',
  //   sessionIds: '',
  //   journeyIds: '',
  //   userIds: '',
  //   eventIds: END_TO_END_TEST_EVENT_ID,
  //   piiTypes: '',
  //   dataPaths: END_TO_END_TEST_DATA_PATH
  // },
  // // endToEndFlowRequestData.endToEndFlowRequestDataWithUserId
  // 7: {
  //   requesterEmail: ZENDESK_REQUESTER_EMAIL,
  //   requesterName: ZENDESK_REQUESTER_NAME,
  //   recipientEmail: ZENDESK_RECIPIENT_EMAIL,
  //   recipientName: ZENDESK_RECIPIENT_NAME,
  //   identifierType: 'user_id',
  //   sessionIds: '',
  //   journeyIds: '',
  //   userIds: END_TO_END_TEST_USER_ID,
  //   eventIds: END_TO_END_TEST_EVENT_ID,
  //   piiTypes: 'passport_number passport_expiry_date',
  //   dataPaths: ''
  // },
  // // endToEndFlowRequestDataWithSessionId
  // 8: {
  //   requesterEmail: ZENDESK_REQUESTER_EMAIL,
  //   requesterName: ZENDESK_REQUESTER_NAME,
  //   recipientEmail: ZENDESK_RECIPIENT_EMAIL,
  //   recipientName: ZENDESK_RECIPIENT_NAME,
  //   identifierType: 'session_id',
  //   sessionIds: END_TO_END_TEST_SESSION_ID,
  //   journeyIds: '',
  //   userIds: '',
  //   eventIds: '',
  //   piiTypes: 'name dob addresses',
  //   dataPaths: ''
  // },
  // // endToEndFlowRequestDataWithJourneyId
  // 9: {
  //   requesterEmail: ZENDESK_REQUESTER_EMAIL,
  //   requesterName: ZENDESK_REQUESTER_NAME,
  //   recipientEmail: ZENDESK_RECIPIENT_EMAIL,
  //   recipientName: ZENDESK_RECIPIENT_NAME,
  //   identifierType: 'journey_id',
  //   sessionIds: '',
  //   journeyIds: END_TO_END_TEST_JOURNEY_ID,
  //   userIds: '',
  //   eventIds: '',
  //   piiTypes: 'drivers_license',
  //   dataPaths: ''
  // },
  // // endToEndFlowRequestDataNoMatch
  // 10: {
  //   requesterEmail: ZENDESK_REQUESTER_EMAIL,
  //   requesterName: ZENDESK_REQUESTER_NAME,
  //   recipientEmail: ZENDESK_RECIPIENT_EMAIL,
  //   recipientName: ZENDESK_RECIPIENT_NAME,
  //   identifierType: 'event_id',
  //   sessionIds: '',
  //   journeyIds: '',
  //   userIds: '',
  //   eventIds: 'zzzzzzzz-yyyy-aaaa-bbbb-cccccccccccc',
  //   piiTypes: 'drivers_license',
  //   dataPaths: END_TO_END_TEST_DATA_PATH
  // },
  // webhookAPIRequestData.validApiTestRequestData
  11: {
    requesterEmail: ZENDESK_REQUESTER_EMAIL,
    requesterName: ZENDESK_REQUESTER_NAME,
    recipientEmail: ZENDESK_RECIPIENT_EMAIL,
    recipientName: ZENDESK_RECIPIENT_NAME,
    identifierType: 'event_id',
    sessionIds: '',
    journeyIds: '',
    userIds: '',
    eventIds: testData.eventId,
    piiTypes: 'drivers_license',
    dataPaths:
      'restricted.this1.that1 restricted.this2.that2 restricted.this3.that3.those3'
  }
}
