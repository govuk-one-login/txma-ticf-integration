import { when } from 'jest-when'
import { ErrorType } from '../../types/audit/auditEventDetails'
import { AuditQueryDataRequestDetails } from '../../types/audit/auditQueryDataRequestDetails'
import { currentDateEpochSeconds } from '../../utils/currentDateEpochSeconds'
import {
  MOCK_AUDIT_DATA_REQUEST_EVENTS_QUEUE_URL,
  TEST_DATE_1,
  TEST_DATE_2,
  TEST_RECIPIENT_EMAIL,
  TEST_RECIPIENT_NAME,
  TEST_REQUESTER_EMAIL,
  TEST_REQUESTER_NAME,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'
import { logger } from '../logger'
import {
  sendAuditDataRequestMessage,
  sendIllegalRequestAuditMessage,
  sendQueryOutputGeneratedAuditMessage
} from './sendAuditMessage'
import { sendSqsMessage } from './sendSqsMessage'

jest.mock('./sendSqsMessage', () => ({
  sendSqsMessage: jest.fn()
}))

jest.mock('../../utils/currentDateEpochSeconds', () => ({
  currentDateEpochSeconds: jest.fn()
}))

const TEST_TIMESTAMP = 1669811435

const errorPrefix = 'An error occurred while sending message to audit queue: '
const errorMessage = 'Error sending message to queue'
const givenSendSqsError = () => {
  when(sendSqsMessage).mockImplementation(() => {
    throw new Error(errorMessage)
  })
}

describe('sendAuditMessage', () => {
  beforeEach(() => {
    when(currentDateEpochSeconds).mockReturnValue(TEST_TIMESTAMP)
    jest.spyOn(logger, 'info')
    jest.spyOn(logger, 'error')
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  describe('sendAuditDataRequestMessage', () => {
    const testAuditQueryRequestDetails = (
      isLegacyDateFromToRequest = false
    ): AuditQueryDataRequestDetails => ({
      requesterEmail: TEST_REQUESTER_EMAIL,
      requesterName: TEST_REQUESTER_NAME,
      recipientEmail: TEST_RECIPIENT_EMAIL,
      recipientName: TEST_RECIPIENT_NAME,
      zendeskId: ZENDESK_TICKET_ID,
      dateFrom: isLegacyDateFromToRequest ? TEST_DATE_1 : undefined,
      dateTo: isLegacyDateFromToRequest ? TEST_DATE_1 : undefined,
      dates: !isLegacyDateFromToRequest
        ? `${TEST_DATE_1} ${TEST_DATE_2}`
        : undefined,
      identifierType: 'event_id',
      requested_sessionIds: '',
      requested_journeyIds: '',
      requested_userIds: '',
      requested_eventIds: '637783 3256',
      piiTypes: 'drivers_license',
      dataPaths: ''
    })
    const testAuditDataRequestEvent = (isLegacyDateFromToRequest = false) => ({
      timestamp: TEST_TIMESTAMP,
      event_name: 'TXMA_AUDIT_QUERY_DATA_REQUEST',
      component_id: 'TXMA',
      restricted: {
        requesterEmail: TEST_REQUESTER_EMAIL,
        requesterName: TEST_REQUESTER_NAME,
        recipientEmail: TEST_RECIPIENT_EMAIL,
        recipientName: TEST_RECIPIENT_NAME
      },
      extensions: {
        ticket_details: {
          zendeskId: ZENDESK_TICKET_ID,
          dateFrom: isLegacyDateFromToRequest ? TEST_DATE_1 : undefined,
          dateTo: isLegacyDateFromToRequest ? TEST_DATE_1 : undefined,
          dates: !isLegacyDateFromToRequest
            ? `${TEST_DATE_1} ${TEST_DATE_2}`
            : undefined,
          identifierType: 'event_id',
          requested_sessionIds: '',
          requested_journeyIds: '',
          requested_userIds: '',
          requested_eventIds: '637783 3256',
          piiTypes: 'drivers_license',
          dataPaths: ''
        }
      }
    })

    it('calls the sendSqsMessage function with the correct parameters', async () => {
      await sendAuditDataRequestMessage(testAuditQueryRequestDetails())
      expect(sendSqsMessage).toHaveBeenCalledWith(
        testAuditDataRequestEvent(),
        MOCK_AUDIT_DATA_REQUEST_EVENTS_QUEUE_URL
      )
    })

    it('calls the sendSqsMessage function correctly when we pass a request with date from/to instead of the new dates array', async () => {
      await sendAuditDataRequestMessage(testAuditQueryRequestDetails(true))
      expect(sendSqsMessage).toHaveBeenCalledWith(
        testAuditDataRequestEvent(true),
        MOCK_AUDIT_DATA_REQUEST_EVENTS_QUEUE_URL
      )
    })

    it('logs an error message when an error occurs', async () => {
      givenSendSqsError()

      await sendAuditDataRequestMessage(testAuditQueryRequestDetails())

      expect(logger.error).toHaveBeenCalledWith(
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
        timestamp: TEST_TIMESTAMP,
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

        expect(logger.info).toHaveBeenCalledWith(
          'sending illegal request audit message'
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

      expect(logger.error).toHaveBeenCalledWith(
        errorPrefix,
        Error(errorMessage)
      )
    })
  })

  describe('sendQueryOutputGeneratedAuditMessage', () => {
    const testQueryOutputGeneratedAuditMessageDetails = {
      timestamp: TEST_TIMESTAMP,
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

      expect(logger.info).toHaveBeenCalledWith(
        'sending query output generated message'
      )
      expect(sendSqsMessage).toHaveBeenCalledWith(
        testQueryOutputGeneratedAuditMessageDetails,
        MOCK_AUDIT_DATA_REQUEST_EVENTS_QUEUE_URL
      )
    })

    it('logs an error message when an error occurs', async () => {
      givenSendSqsError()

      await sendQueryOutputGeneratedAuditMessage(ZENDESK_TICKET_ID)

      expect(logger.error).toHaveBeenCalledWith(
        errorPrefix,
        Error(errorMessage)
      )
    })
  })
})
