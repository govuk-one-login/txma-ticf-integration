import { when } from 'jest-when'
import { AuditQueryDataRequestDetails } from '../../types/audit/auditQueryDataRequestDetails'
import {
  MOCK_AUDIT_DATA_REQUEST_EVENTS_QUEUE_URL,
  TEST_DATE_FROM,
  TEST_DATE_TO,
  TEST_RECIPIENT_EMAIL,
  TEST_RECIPIENT_NAME,
  TEST_REQUESTER_EMAIL,
  TEST_REQUESTER_NAME,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'
import {
  sendAuditDataRequestMessage,
  sendIllegalRequestAuditMessage,
  sendQueryOutputGeneratedAuditMessage
} from './sendAuditMessage'
import { sendSqsMessage } from './sendSqsMessage'

jest.mock('./sendSqsMessage', () => ({
  sendSqsMessage: jest.fn()
}))

const testTimeStamp = Date.now()

const errorPrefix = 'An error occurred while sending message to audit queue: '
const errorMessage = 'An error occurred sending a message to the Audit queue'
const givenSendSqsError = () => {
  when(sendSqsMessage).mockImplementation(() => {
    throw new Error(errorMessage)
  })
}

describe('sendAuditMessage', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(testTimeStamp)
    jest.spyOn(global.console, 'log')
    jest.spyOn(global.console, 'error')
  })
  afterEach(() => {
    jest.useRealTimers()
    jest.resetAllMocks()
  })
  describe('sendAuditDataRequestMessage', () => {
    const testAuditQueryRequestDetails: AuditQueryDataRequestDetails = {
      requesterEmail: TEST_REQUESTER_EMAIL,
      requesterName: TEST_REQUESTER_NAME,
      recipientEmail: TEST_RECIPIENT_EMAIL,
      recipientName: TEST_RECIPIENT_NAME,
      zendeskId: ZENDESK_TICKET_ID,
      dateFrom: TEST_DATE_FROM,
      dateTo: TEST_DATE_TO,
      identifierType: 'event_id',
      requested_sessionIds: '',
      requested_journeyIds: '',
      requested_userIds: '',
      requested_eventIds: '637783 3256',
      piiTypes: 'drivers_license',
      dataPaths: ''
    }
    const stringTestAuditQueryRequestDetails = JSON.stringify(
      testAuditQueryRequestDetails
    )
    const testAuditDataRequestEvent = {
      timestamp: testTimeStamp,
      event_name: 'TXMA_AUDIT_QUERY_DATA_REQUEST',
      component_id: 'TXMA',
      restricted: {
        requesterEmail: testAuditQueryRequestDetails.requesterEmail,
        requesterName: testAuditQueryRequestDetails.requesterName,
        recipientEmail: testAuditQueryRequestDetails.recipientEmail,
        recipientName: testAuditQueryRequestDetails.recipientName
      },
      extensions: {
        ticket_details: {
          zendeskId: testAuditQueryRequestDetails.zendeskId,
          dateFrom: testAuditQueryRequestDetails.dateFrom,
          dateTo: testAuditQueryRequestDetails.dateTo,
          identifierType: testAuditQueryRequestDetails.identifierType,
          requested_sessionIds: '',
          requested_journeyIds: '',
          requested_userIds: '',
          requested_eventIds: testAuditQueryRequestDetails.requested_eventIds,
          piiTypes: testAuditQueryRequestDetails.piiTypes,
          dataPaths: ''
        }
      }
    }

    it('calls the sendSqsMessage function with the correct parameters', async () => {
      await sendAuditDataRequestMessage(stringTestAuditQueryRequestDetails)

      expect(console.log).toHaveBeenCalledWith(
        'sending audit data request message',
        testAuditQueryRequestDetails
      )
      expect(sendSqsMessage).toHaveBeenCalledWith(
        testAuditDataRequestEvent,
        MOCK_AUDIT_DATA_REQUEST_EVENTS_QUEUE_URL
      )
    })

    it('logs an error message when an error occurs', async () => {
      givenSendSqsError()

      await sendAuditDataRequestMessage(stringTestAuditQueryRequestDetails)

      expect(console.error).toHaveBeenCalledWith(
        errorPrefix,
        Error(errorMessage)
      )
    })
  })

  describe('sendIllegalRequestAuditMessage', () => {
    const testAuditQueryIllegalRequestDetails = {
      timestamp: testTimeStamp,
      event_name: 'TXMA_AUDIT_QUERY_ILLEGAL_REQUEST',
      component_id: 'TXMA',
      extensions: {
        ticket_details: {
          zendeskId: ZENDESK_TICKET_ID
        }
      }
    }

    it('calls the sendSqsMessage function with the correct parameters', async () => {
      await sendIllegalRequestAuditMessage(ZENDESK_TICKET_ID)

      expect(console.log).toHaveBeenCalledWith(
        'sending illegal request audit message for zendeskId ',
        ZENDESK_TICKET_ID
      )
      expect(sendSqsMessage).toHaveBeenCalledWith(
        testAuditQueryIllegalRequestDetails,
        MOCK_AUDIT_DATA_REQUEST_EVENTS_QUEUE_URL
      )
    })

    it('logs an error message when an error occurs', async () => {
      givenSendSqsError()

      await sendIllegalRequestAuditMessage(ZENDESK_TICKET_ID)

      expect(console.error).toHaveBeenCalledWith(
        errorPrefix,
        Error(errorMessage)
      )
    })
  })

  describe('sendQueryOutputGeneratedAuditMessage', () => {
    const testQueryOutputGeneratedAuditMessageDetails = {
      timestamp: testTimeStamp,
      event_name: 'TXMA_AUDIT_QUERY_OUTPUT_GENERATED',
      component_id: 'TXMA',
      extensions: {
        ticket_details: {
          zendeskId: ZENDESK_TICKET_ID
        }
      }
    }
    it('calls the sendSqsMessage function with the correct parameters', async () => {
      await sendQueryOutputGeneratedAuditMessage(ZENDESK_TICKET_ID)

      expect(console.log).toHaveBeenCalledWith(
        'sending query output generated message for zendeskId ',
        ZENDESK_TICKET_ID
      )
      expect(sendSqsMessage).toHaveBeenCalledWith(
        testQueryOutputGeneratedAuditMessageDetails,
        MOCK_AUDIT_DATA_REQUEST_EVENTS_QUEUE_URL
      )
    })

    it('logs an error message when an error occurs', async () => {
      givenSendSqsError()

      await sendQueryOutputGeneratedAuditMessage(ZENDESK_TICKET_ID)

      expect(console.error).toHaveBeenCalledWith(
        errorPrefix,
        Error(errorMessage)
      )
    })
  })
})
