import { testData } from '../constants/testData'
import {
  ZENDESK_REQUESTER_EMAIL,
  ZENDESK_REQUESTER_NAME,
  ZENDESK_RECIPIENT_EMAIL,
  ZENDESK_RECIPIENT_NAME
} from '../../shared-test-code/constants/zendeskParameters'
import { ZendeskTicketTestData } from '../../shared-test-code/types/zendeskWebhookRequest'

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
    dataPaths: testData.dataPaths
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
    dataPaths: testData.dataPaths
  }
}
