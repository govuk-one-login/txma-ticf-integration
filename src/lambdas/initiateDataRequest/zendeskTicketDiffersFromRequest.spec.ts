import { getZendeskTicket } from '../../sharedServices/zendesk/getZendeskTicket'
import { getZendeskUser } from '../../sharedServices/zendesk/getZendeskUser'
import { DataRequestParams } from '../../types/dataRequestParams'
import {
  testDataRequest,
  testDataRequestWithAllValuesSet,
  testDataRequestWithEmptyValuesForIds
} from '../../utils/tests/testDataRequest'
import { ZendeskTicket } from '../../types/zendeskTicketResult'
import { ZendeskUser } from '../../types/zendeskUserResult'
import {
  TEST_DATE_FROM,
  TEST_DATE_TO,
  TEST_RECIPIENT_EMAIL,
  TEST_RECIPIENT_NAME,
  TEST_REQUESTER_EMAIL,
  TEST_REQUESTER_NAME,
  TEST_ZENDESK_FIELD_ID_DATA_PATHS,
  TEST_ZENDESK_FIELD_ID_DATE_FROM,
  TEST_ZENDESK_FIELD_ID_DATE_TO,
  TEST_ZENDESK_FIELD_ID_EVENT_IDS,
  TEST_ZENDESK_FIELD_ID_IDENTIFIER_TYPE,
  TEST_ZENDESK_FIELD_ID_JOURNEY_IDS,
  TEST_ZENDESK_FIELD_ID_PII_TYPES,
  TEST_ZENDESK_FIELD_ID_RECIPIENT_EMAIL,
  TEST_ZENDESK_FIELD_ID_RECIPIENT_NAME,
  TEST_ZENDESK_FIELD_ID_SESSION_IDS,
  TEST_ZENDESK_FIELD_ID_USER_IDS,
  ZENDESK_PII_TYPE_PREFIX,
  ZENDESK_TICKET_ID_AS_NUMBER
} from '../../utils/tests/testConstants'
import { zendeskTicketDiffersFromRequest } from './zendeskTicketDiffersFromRequest'

jest.mock('../../sharedServices/zendesk/getZendeskTicket', () => ({
  getZendeskTicket: jest.fn()
}))

jest.mock('../../sharedServices/zendesk/getZendeskUser', () => ({
  getZendeskUser: jest.fn()
}))

const mockGetZendeskTicket = getZendeskTicket as jest.Mock<
  Promise<ZendeskTicket>
>
const mockGetZendeskUser = getZendeskUser as jest.Mock<Promise<ZendeskUser>>

describe('match zendesk ticket details', () => {
  beforeEach(() => {
    jest.spyOn(global.console, 'warn')
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  const updateKey = <K extends keyof DataRequestParams>(
    key: K,
    value: DataRequestParams[K],
    requestParams: DataRequestParams
  ) => {
    requestParams[key] = value
  }

  const givenZendeskTicketMatches = () => {
    mockGetZendeskTicket.mockImplementation(() =>
      Promise.resolve({
        id: ZENDESK_TICKET_ID_AS_NUMBER,
        requester_id: 123,
        custom_fields: [
          {
            id: TEST_ZENDESK_FIELD_ID_DATA_PATHS,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_DATE_FROM,
            value: TEST_DATE_FROM
          },
          {
            id: TEST_ZENDESK_FIELD_ID_DATE_TO,
            value: TEST_DATE_TO
          },
          {
            id: TEST_ZENDESK_FIELD_ID_EVENT_IDS,
            value: '123 456'
          },
          {
            id: TEST_ZENDESK_FIELD_ID_IDENTIFIER_TYPE,
            value: 'event_id'
          },
          {
            id: TEST_ZENDESK_FIELD_ID_JOURNEY_IDS,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_PII_TYPES,
            value: [`${ZENDESK_PII_TYPE_PREFIX}passport_number`]
          },
          {
            id: TEST_ZENDESK_FIELD_ID_SESSION_IDS,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_USER_IDS,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_RECIPIENT_EMAIL,
            value: TEST_RECIPIENT_EMAIL
          },
          {
            id: TEST_ZENDESK_FIELD_ID_RECIPIENT_NAME,
            value: TEST_RECIPIENT_NAME
          }
        ]
      })
    )
    mockGetZendeskUser.mockImplementation(() =>
      Promise.resolve({
        email: TEST_REQUESTER_EMAIL,
        name: TEST_REQUESTER_NAME
      })
    )
  }

  const givenZendeskTicketMatchesWithNoPiiTypePrefix = () => {
    mockGetZendeskTicket.mockImplementation(() =>
      Promise.resolve({
        id: ZENDESK_TICKET_ID_AS_NUMBER,
        requester_id: 123,
        custom_fields: [
          {
            id: TEST_ZENDESK_FIELD_ID_DATA_PATHS,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_DATE_FROM,
            value: TEST_DATE_FROM
          },
          {
            id: TEST_ZENDESK_FIELD_ID_DATE_TO,
            value: TEST_DATE_TO
          },
          {
            id: TEST_ZENDESK_FIELD_ID_EVENT_IDS,
            value: '123 456'
          },
          {
            id: TEST_ZENDESK_FIELD_ID_IDENTIFIER_TYPE,
            value: 'event_id'
          },
          {
            id: TEST_ZENDESK_FIELD_ID_JOURNEY_IDS,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_PII_TYPES,
            value: ['passport_number']
          },
          {
            id: TEST_ZENDESK_FIELD_ID_SESSION_IDS,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_USER_IDS,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_RECIPIENT_EMAIL,
            value: TEST_RECIPIENT_EMAIL
          },
          {
            id: TEST_ZENDESK_FIELD_ID_RECIPIENT_NAME,
            value: TEST_RECIPIENT_NAME
          }
        ]
      })
    )
    mockGetZendeskUser.mockImplementation(() =>
      Promise.resolve({
        email: TEST_REQUESTER_EMAIL,
        name: TEST_REQUESTER_NAME
      })
    )
  }

  const givenZendeskTicketDoesNotMatchValues = (
    parameterName: string,
    parameterValue: string | string[]
  ) => {
    mockGetZendeskTicket.mockImplementation(() =>
      Promise.resolve({
        id: ZENDESK_TICKET_ID_AS_NUMBER,
        requester_id: 123,
        custom_fields: [
          {
            id: TEST_ZENDESK_FIELD_ID_DATA_PATHS,
            value: 'path_to_data1 path_to_data2'
          },
          {
            id: TEST_ZENDESK_FIELD_ID_DATE_FROM,
            value: TEST_DATE_FROM
          },
          {
            id: TEST_ZENDESK_FIELD_ID_DATE_TO,
            value: TEST_DATE_TO
          },
          {
            id: TEST_ZENDESK_FIELD_ID_EVENT_IDS,
            value: '123 456'
          },
          {
            id: TEST_ZENDESK_FIELD_ID_IDENTIFIER_TYPE,
            value: 'event_id'
          },
          {
            id: TEST_ZENDESK_FIELD_ID_JOURNEY_IDS,
            value: '123 456'
          },
          {
            id: TEST_ZENDESK_FIELD_ID_PII_TYPES,
            value: [`${ZENDESK_PII_TYPE_PREFIX}passport_number`]
          },
          {
            id: TEST_ZENDESK_FIELD_ID_SESSION_IDS,
            value: '123 456'
          },
          {
            id: TEST_ZENDESK_FIELD_ID_USER_IDS,
            value: '123 456'
          },
          {
            id: TEST_ZENDESK_FIELD_ID_RECIPIENT_EMAIL,
            value: TEST_RECIPIENT_EMAIL
          },
          {
            id: TEST_ZENDESK_FIELD_ID_RECIPIENT_NAME,
            value: TEST_RECIPIENT_NAME
          }
        ]
      })
    )

    mockGetZendeskUser.mockImplementation(() =>
      Promise.resolve({
        email: 'myuser@test.gov.uk',
        name: 'my name'
      })
    )
    const newRequest = Object.assign(
      {},
      testDataRequestWithAllValuesSet
    ) as DataRequestParams

    updateKey(
      parameterName as keyof DataRequestParams,
      parameterValue,
      newRequest
    )

    return newRequest
  }

  const givenZendeskTicketDoesNotMatchWhenMissingValues = (
    parameterName: string,
    parameterValue: string | string[]
  ) => {
    mockGetZendeskTicket.mockImplementation(() =>
      Promise.resolve({
        id: ZENDESK_TICKET_ID_AS_NUMBER,
        requester_id: 123,
        custom_fields: [
          {
            id: TEST_ZENDESK_FIELD_ID_DATA_PATHS,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_DATE_FROM,
            value: TEST_DATE_FROM
          },
          {
            id: TEST_ZENDESK_FIELD_ID_DATE_TO,
            value: TEST_DATE_TO
          },
          {
            id: TEST_ZENDESK_FIELD_ID_EVENT_IDS,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_IDENTIFIER_TYPE,
            value: 'event_id'
          },
          {
            id: TEST_ZENDESK_FIELD_ID_JOURNEY_IDS,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_PII_TYPES,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_SESSION_IDS,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_USER_IDS,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_RECIPIENT_EMAIL,
            value: TEST_RECIPIENT_EMAIL
          },
          {
            id: TEST_ZENDESK_FIELD_ID_RECIPIENT_NAME,
            value: TEST_RECIPIENT_NAME
          }
        ]
      })
    )

    mockGetZendeskUser.mockImplementation(() =>
      Promise.resolve({
        email: 'myuser@test.gov.uk',
        name: 'my name'
      })
    )

    const newRequest = Object.assign(
      {},
      testDataRequestWithEmptyValuesForIds
    ) as DataRequestParams

    updateKey(
      parameterName as keyof DataRequestParams,
      parameterValue,
      newRequest
    )

    return newRequest
  }

  const givenCustomFieldNotFound = () => {
    mockGetZendeskTicket.mockImplementation(() =>
      Promise.resolve({
        id: ZENDESK_TICKET_ID_AS_NUMBER,
        requester_id: 123,
        custom_fields: [
          {
            id: TEST_ZENDESK_FIELD_ID_DATE_FROM,
            value: TEST_DATE_FROM
          },
          {
            id: TEST_ZENDESK_FIELD_ID_DATE_TO,
            value: TEST_DATE_TO
          },
          {
            id: TEST_ZENDESK_FIELD_ID_EVENT_IDS,
            value: '123 456'
          },
          {
            id: TEST_ZENDESK_FIELD_ID_IDENTIFIER_TYPE,
            value: 'event_id'
          },
          {
            id: TEST_ZENDESK_FIELD_ID_JOURNEY_IDS,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_PII_TYPES,
            value: [`${ZENDESK_PII_TYPE_PREFIX}passport_number`]
          },
          {
            id: TEST_ZENDESK_FIELD_ID_SESSION_IDS,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_USER_IDS,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_RECIPIENT_EMAIL,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_RECIPIENT_NAME,
            value: null
          }
        ]
      })
    )
    mockGetZendeskUser.mockImplementation(() =>
      Promise.resolve({
        email: 'myuser@test.gov.uk',
        name: 'my name'
      })
    )
  }

  test('ticket and request match', async () => {
    givenZendeskTicketMatches()
    expect(await zendeskTicketDiffersFromRequest(testDataRequest)).toEqual(
      false
    )
  })

  test('ticket and request match with no PII type prefix in response from Zendesk', async () => {
    givenZendeskTicketMatchesWithNoPiiTypePrefix()
    expect(await zendeskTicketDiffersFromRequest(testDataRequest)).toEqual(
      false
    )
  })

  test.each([
    ['zendeskId', '123456789'],
    ['recipientEmail', 'notmyemail@example.gov.uk'],
    ['recipientName', 'not my name'],
    ['requesterEmail', 'notmyemail@example.gov.uk'],
    ['requesterName', 'not my name'],
    ['dataPaths', ['123456789']],
    ['dateFrom', '123456789'],
    ['dateTo', '123456789'],
    ['eventIds', ['123456789']],
    ['journeyIds', ['123456789']],
    ['piiTypes', ['123456789']]
  ])(
    '%p does not match given values',
    async (parameterName: string, parameterValue: string | string[]) => {
      const request = givenZendeskTicketDoesNotMatchValues(
        parameterName,
        parameterValue
      )

      expect(await zendeskTicketDiffersFromRequest(request)).toEqual(true)
      expect(console.warn).toHaveBeenCalledWith(
        'Request does not match values on Ticket, the following parameters do not match:',
        [parameterName]
      )
    }
  )

  test.each([
    ['dataPaths', []],
    ['eventIds', []],
    ['journeyIds', []],
    ['piiTypes', []]
  ])(
    '%p does not match with empty array request value',
    async (parameterName: string, parameterValue: string[]) => {
      const request = givenZendeskTicketDoesNotMatchValues(
        parameterName,
        parameterValue
      )

      expect(await zendeskTicketDiffersFromRequest(request)).toEqual(true)
      expect(console.warn).toHaveBeenCalledWith(
        'Request does not match values on Ticket, the following parameters do not match:',
        [parameterName]
      )
    }
  )

  test.each([
    ['dataPaths', ['123456789']],
    ['eventIds', ['123456789']],
    ['journeyIds', ['123456789']],
    ['piiTypes', ['123456789']]
  ])(
    'does not match when ticket missing value %p',
    async (parameterName: string, parameterValue: string | string[]) => {
      const request = givenZendeskTicketDoesNotMatchWhenMissingValues(
        parameterName,
        parameterValue
      )

      expect(await zendeskTicketDiffersFromRequest(request)).toEqual(true)
      expect(console.warn).toHaveBeenCalledWith(
        'Request does not match values on Ticket, the following parameters do not match:',
        [parameterName]
      )
    }
  )

  test('custom field not found in ticket', async () => {
    givenCustomFieldNotFound()

    const error = async () => {
      await zendeskTicketDiffersFromRequest(testDataRequest)
    }
    await expect(error()).rejects.toThrow('Custom field with id 1 not found')
  })
})
