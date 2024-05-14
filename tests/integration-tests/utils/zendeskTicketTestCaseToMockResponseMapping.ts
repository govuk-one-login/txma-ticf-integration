import { testData } from '../constants/testData'
import { ZendeskTicketTestData } from '../../shared-test-code/types/zendeskWebhookRequest'
import { zendeskConstants } from '../../shared-test-code/constants/zendeskParameters'
const addPrefixToZendeskPiiType = (piiType: string) =>
  `${zendeskConstants.piiTypesPrefix}${piiType}`

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
    piiTypes: addPrefixToZendeskPiiType('drivers_licence'),
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
    piiTypes: addPrefixToZendeskPiiType('drivers_licence'),
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
    piiTypes: addPrefixToZendeskPiiType('drivers_licence'),
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
    piiTypes: addPrefixToZendeskPiiType('drivers_licence'),
    dataPaths: ''
  }
}
