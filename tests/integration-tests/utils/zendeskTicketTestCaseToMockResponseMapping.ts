import { testData } from '../constants/testData'
import { ZendeskTicketTestData } from '../../shared-test-code/types/zendeskWebhookRequest'

export const zendeskTicketTestCaseToMockResponseMapping: {
  [key: number]: ZendeskTicketTestData
} = {
  // dataCopyRequestData.validRequestData
  1: {
    requesterEmail: testData.mockServerValues.requesterEmail,
    requesterName: testData.mockServerValues.requesterName,
    recipientEmail: testData.mockServerValues.recipientEmail,
    recipientName: testData.mockServerValues.recipientName,
    identifierType: 'event_id',
    sessionIds: '',
    journeyIds: '',
    userIds: '',
    eventIds: testData.eventId,
    piiTypes: 'drivers_license',
    dataPaths: testData.dataPaths
  },
  // validGlacierRequestData
  3: {
    requesterEmail: testData.mockServerValues.requesterEmail,
    requesterName: testData.mockServerValues.requesterName,
    recipientEmail: testData.mockServerValues.recipientEmail,
    recipientName: testData.mockServerValues.recipientName,
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
    requesterEmail: testData.mockServerValues.requesterEmail,
    requesterName: testData.mockServerValues.requesterName,
    recipientEmail: testData.mockServerValues.recipientEmail,
    recipientName: testData.mockServerValues.recipientName,
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
    requesterEmail: testData.mockServerValues.requesterEmail,
    requesterName: testData.mockServerValues.requesterName,
    recipientEmail: testData.mockServerValues.recipientEmail,
    recipientName: testData.mockServerValues.recipientName,
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
    requesterEmail: testData.mockServerValues.requesterEmail,
    requesterName: testData.mockServerValues.requesterName,
    recipientEmail: testData.mockServerValues.recipientEmail,
    recipientName: testData.mockServerValues.recipientName,
    identifierType: 'event_id',
    sessionIds: '',
    journeyIds: '',
    userIds: '',
    eventIds: testData.eventId,
    piiTypes: 'drivers_license',
    dataPaths: testData.dataPaths
  }
}
