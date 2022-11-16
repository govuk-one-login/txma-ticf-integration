import { when } from 'jest-when'
import { ErrorType } from '../../types/audit/auditEventDetails'
import { AuditQueryDataRequestDetails } from '../../types/audit/auditQueryDataRequestDetails'
import { currentDateEpochMilliseconds } from '../../utils/currentDateEpochMilliseconds'
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

jest.mock('../../utils/currentDateEpochMilliseconds', () => ({
  currentDateEpochMilliseconds: jest.fn()
}))

const testTimeStamp = Date.now()

const errorPrefix = 'An error occurred while sending message to audit queue: '
const errorMessage = 'Error sending message to queue'
const givenSendSqsError = () => {
  when(sendSqsMessage).mockImplementation(() => {
    throw new Error(errorMessage)
  })
}

describe('sendAuditMessage', () => {
  beforeEach(() => {
    when(currentDateEpochMilliseconds).mockReturnValue(testTimeStamp)
    jest.spyOn(global.console, 'log')
    jest.spyOn(global.console, 'error')
  })
  afterEach(() => {
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
      await sendAuditDataRequestMessage(testAuditQueryRequestDetails)

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

      await sendAuditDataRequestMessage(testAuditQueryRequestDetails)

      expect(console.error).toHaveBeenCalledWith(
        errorPrefix,
        Error(errorMessage)
      )
    })
  })

  describe('sendIllegalRequestAuditMessage', () => {
    const createTestAuditQueryIllegalRequestDetails = (
      errorType: string,
      errorDescription: string
    ) => {
      return {
        timestamp: testTimeStamp,
        event_name: 'TXMA_AUDIT_QUERY_ILLEGAL_REQUEST',
        component_id: 'TXMA',
        extensions: {
          error: {
            error_type: errorType,
            error_description: errorDescription
          },
          ticket_details: {
            zendeskId: ZENDESK_TICKET_ID
          }
        }
      }
    }

    it.each([
      [
        'invalid-signature' as ErrorType,
        'The webhook signature check failed, probably indicating that the request did not come from Zendesk'
      ],
      [
        'mismatched-ticket' as ErrorType,
        'There is a ticket for the given Zendesk ID, but some of its details are mismatched'
      ],
      [
        'non-existent-ticket' as ErrorType,
        'There is no ticket for the given Zendesk ID'
      ]
    ])(
      'calls the sendSqsMessage function with the correct parameters when errorType is %p',
      async (errorType: ErrorType, errorDescription) => {
        const testAuditQueryIllegalRequestDetails =
          createTestAuditQueryIllegalRequestDetails(errorType, errorDescription)

        await sendIllegalRequestAuditMessage(ZENDESK_TICKET_ID, errorType)

        expect(console.log).toHaveBeenCalledWith(
          'sending illegal request audit message for zendeskId ',
          ZENDESK_TICKET_ID
        )
        expect(sendSqsMessage).toHaveBeenCalledWith(
          testAuditQueryIllegalRequestDetails,
          MOCK_AUDIT_DATA_REQUEST_EVENTS_QUEUE_URL
        )
      }
    )

    it('logs an error message when an error occurs', async () => {
      const exampleErrorType: ErrorType = 'invalid-signature'
      givenSendSqsError()

      await sendIllegalRequestAuditMessage(ZENDESK_TICKET_ID, exampleErrorType)

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
