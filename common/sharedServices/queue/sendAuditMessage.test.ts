import { when } from 'jest-when'
import { ErrorType } from '../../../common/types/audit/auditEventDetails'
import { AuditQueryDataRequestDetails } from '../../../common/types/audit/auditQueryDataRequestDetails'
import { currentDateEpochSeconds } from '../../utils/currentDateEpochSeconds'
import {
  MOCK_AUDIT_DATA_REQUEST_EVENTS_QUEUE_URL,
  TEST_DATE_1,
  TEST_DATE_2,
  TEST_RECIPIENT_EMAIL,
  TEST_RECIPIENT_NAME,
  TEST_REQUESTER_EMAIL,
  TEST_REQUESTER_NAME,
  ZENDESK_TICKET_ID,
  TEST_SQS_MESSAGE_ID
} from '../../../common/utils/tests/testConstants'
import { logger } from '../../../common/sharedServices/logger'
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

const givenSendSQSMessageReturnsMessageId = () => {
  when(sendSqsMessage).mockResolvedValue(TEST_SQS_MESSAGE_ID)
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
      piiTypes: 'drivers_licence',
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
          piiTypes: 'drivers_licence',
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

    it('logs success message when message is sent successfully', async () => {
      givenSendSQSMessageReturnsMessageId()

      await sendAuditDataRequestMessage(testAuditQueryRequestDetails())

      expect(logger.info).toHaveBeenCalledWith(
        'sent audit data request message',
        { messageId: TEST_SQS_MESSAGE_ID }
      )
    })

    it('handles null/undefined values for request IDs using nulls', async () => {
      const testDetailsWithNulls = {
        ...testAuditQueryRequestDetails(),
        requested_sessionIds: null,
        requested_journeyIds: undefined,
        requested_userIds: null,
        requested_eventIds: undefined
      } as AuditQueryDataRequestDetails & {
        requested_sessionIds: null
        requested_journeyIds: undefined
        requested_userIds: null
        requested_eventIds: undefined
      }

      const expectedEvent = {
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
            dateFrom: undefined,
            dateTo: undefined,
            dates: `${TEST_DATE_1} ${TEST_DATE_2}`,
            identifierType: 'event_id',
            requested_sessionIds: '',
            requested_journeyIds: '',
            requested_userIds: '',
            requested_eventIds: '',
            piiTypes: 'drivers_licence',
            dataPaths: ''
          }
        }
      }

      await sendAuditDataRequestMessage(testDetailsWithNulls)

      expect(sendSqsMessage).toHaveBeenCalledWith(
        expectedEvent,
        MOCK_AUDIT_DATA_REQUEST_EVENTS_QUEUE_URL
      )
    })
  })

  describe('sendIllegalRequestAuditMessage', () => {
    const createTestAuditQueryIllegalRequestDetails = (
      errorType: string,
      errorDescription: string,
      zendeskId?: string
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
            zendeskId: zendeskId || ''
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
        givenSendSQSMessageReturnsMessageId()

        await sendIllegalRequestAuditMessage(ZENDESK_TICKET_ID, errorType)

        expect(logger.info).toHaveBeenCalledWith(
          'Sent TXMA_AUDIT_QUERY_ILLEGAL_REQUEST event',
          { messageId: TEST_SQS_MESSAGE_ID }
        )
        expect(sendSqsMessage).toHaveBeenCalledWith(
          createTestAuditQueryIllegalRequestDetails(
            errorType,
            errorDescription,
            ZENDESK_TICKET_ID
          ),
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

    it('handles undefined zendeskId by setting empty string', async () => {
      const exampleErrorType: ErrorType = 'invalid-signature'
      const errorDescription =
        'The webhook signature check failed, probably indicating that the request did not come from Zendesk'
      givenSendSQSMessageReturnsMessageId()

      await sendIllegalRequestAuditMessage(undefined, exampleErrorType)

      expect(sendSqsMessage).toHaveBeenCalledWith(
        createTestAuditQueryIllegalRequestDetails(
          exampleErrorType,
          errorDescription,
          ''
        ),
        MOCK_AUDIT_DATA_REQUEST_EVENTS_QUEUE_URL
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
      givenSendSQSMessageReturnsMessageId()
      await sendQueryOutputGeneratedAuditMessage(ZENDESK_TICKET_ID)

      expect(logger.info).toHaveBeenCalledWith(
        'Sent TXMA_AUDIT_QUERY_OUTPUT_GENERATED event',
        { messageId: TEST_SQS_MESSAGE_ID }
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
