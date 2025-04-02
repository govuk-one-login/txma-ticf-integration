import { getZendeskTicket } from '../../../common/sharedServices/zendesk/getZendeskTicket'
import { getZendeskUser } from '../../../common/sharedServices/zendesk/getZendeskUser'
import { DataRequestParams } from '../../../common/types/dataRequestParams'
import {
  testDataRequest,
  testDataRequestWithAllValuesSet,
  testDataRequestWithEmptyValuesForIds
} from '../../../common/utils/tests/testDataRequest'
import {
  CustomField,
  ZendeskTicket
} from '../../../common/types/zendeskTicketResult'
import { ZendeskUser } from '../../../common/types/zendeskUserResult'
import {
  TEST_DATE_1,
  TEST_DATE_2,
  TEST_RECIPIENT_EMAIL,
  TEST_RECIPIENT_NAME,
  TEST_REQUESTER_EMAIL,
  TEST_REQUESTER_NAME,
  TEST_ZENDESK_FIELD_ID_DATA_PATHS,
  TEST_ZENDESK_FIELD_ID_DATES,
  TEST_ZENDESK_FIELD_ID_DATE_FROM,
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
} from '../../../common/utils/tests/testConstants'
import { zendeskTicketDiffersFromRequest } from './zendeskTicketDiffersFromRequest'
import { logger } from '../../../common/sharedServices/logger'

jest.mock('../../../common/sharedServices/zendesk/getZendeskTicket', () => ({
  getZendeskTicket: jest.fn()
}))

jest.mock('../../../common/sharedServices/zendesk/getZendeskUser', () => ({
  getZendeskUser: jest.fn()
}))

const mockGetZendeskTicket = getZendeskTicket as jest.Mock<
  Promise<ZendeskTicket>
>
const mockGetZendeskUser = getZendeskUser as jest.Mock<Promise<ZendeskUser>>

describe('match zendesk ticket details', () => {
  beforeEach(() => {
    jest.spyOn(logger, 'warn')
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

  const standardTicketFields = [
    {
      id: TEST_ZENDESK_FIELD_ID_DATA_PATHS,
      value: null
    },
    {
      id: TEST_ZENDESK_FIELD_ID_DATE_FROM,
      value: null
    },
    {
      id: TEST_ZENDESK_FIELD_ID_DATES,
      value: `${TEST_DATE_1} ${TEST_DATE_2}`
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

  const getCustomFieldListWithItem = (
    customFields: CustomField[],
    customFieldsToSet: CustomField[]
  ): CustomField[] => {
    const clonedFieldArray = [...customFields]
    customFieldsToSet.forEach((customField) => {
      const item = clonedFieldArray.find((f) => f.id === customField.id)
      if (item) {
        item.value = customField.value
      } else {
        clonedFieldArray.push(customField)
      }
    })
    return clonedFieldArray
  }

  const givenZendeskTicketHasStandardFieldsSetWithDateList = () => {
    mockGetZendeskTicket.mockImplementation(() =>
      Promise.resolve({
        id: ZENDESK_TICKET_ID_AS_NUMBER,
        requester_id: 123,
        custom_fields: getCustomFieldListWithItem(standardTicketFields, [
          {
            id: TEST_ZENDESK_FIELD_ID_DATES,
            value: `${TEST_DATE_1} ${TEST_DATE_2}`
          }
        ])
      })
    )
    mockGetZendeskUser.mockImplementation(() =>
      Promise.resolve({
        email: TEST_REQUESTER_EMAIL,
        name: TEST_REQUESTER_NAME
      })
    )
  }

  const givenZendeskTicketHasLegacyDateSet = () => {
    mockGetZendeskTicket.mockImplementation(() =>
      Promise.resolve({
        id: ZENDESK_TICKET_ID_AS_NUMBER,
        requester_id: 123,
        custom_fields: getCustomFieldListWithItem(standardTicketFields, [
          {
            id: TEST_ZENDESK_FIELD_ID_DATE_FROM,
            value: TEST_DATE_1
          }
        ])
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
        custom_fields: getCustomFieldListWithItem(standardTicketFields, [
          {
            id: TEST_ZENDESK_FIELD_ID_PII_TYPES,
            value: ['passport_number']
          }
        ])
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
            id: TEST_ZENDESK_FIELD_ID_DATE_FROM,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_DATES,
            value: `${TEST_DATE_1} ${TEST_DATE_2}`
          },
          {
            id: TEST_ZENDESK_FIELD_ID_DATA_PATHS,
            value: 'path_to_data1 path_to_data2'
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
        email: 'myuser@example.com',
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
            id: TEST_ZENDESK_FIELD_ID_DATE_FROM,
            value: null
          },
          {
            id: TEST_ZENDESK_FIELD_ID_DATES,
            value: `${TEST_DATE_1} ${TEST_DATE_2}`
          },
          {
            id: TEST_ZENDESK_FIELD_ID_DATA_PATHS,
            value: null
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
        email: 'myuser@example.com',
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
        custom_fields: standardTicketFields.filter(
          (f) => f.id != TEST_ZENDESK_FIELD_ID_DATA_PATHS
        )
      })
    )
    mockGetZendeskUser.mockImplementation(() =>
      Promise.resolve({
        email: 'myuser@example.com',
        name: 'my name'
      })
    )
  }

  test('ticket and request match', async () => {
    givenZendeskTicketHasStandardFieldsSetWithDateList()
    expect(await zendeskTicketDiffersFromRequest(testDataRequest)).toEqual(
      false
    )
  })

  test('ticket and request match with legacy date field set', async () => {
    givenZendeskTicketHasLegacyDateSet()
    testDataRequest.dates = [TEST_DATE_1]
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
    ['recipientEmail', 'notmyemail@example.com'],
    ['recipientName', 'not my name'],
    ['requesterEmail', 'notmyemail@example.com'],
    ['dataPaths', ['123456789']],
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
      expect(logger.warn).toHaveBeenCalledWith(
        'Request does not match values on Ticket, the following parameters do not match:',
        { unmatchedParameters: [parameterName] }
      )
    }
  )

  test('Date field set in Zendesk ticket which does not match dates array in request', async () => {
    givenZendeskTicketHasLegacyDateSet()
    const testRequest = Object.assign({}, testDataRequest)
    testRequest.dates = ['2023-01-04']
    expect(await zendeskTicketDiffersFromRequest(testRequest)).toEqual(true)
    expect(logger.warn).toHaveBeenCalledWith(
      'Request does not match values on Ticket, the following parameters do not match:',
      { unmatchedParameters: ['date'] }
    )
  })

  test('Date list field set in Zendesk ticket which does not match dates array in request', async () => {
    givenZendeskTicketHasStandardFieldsSetWithDateList()
    const testRequest = Object.assign({}, testDataRequest)
    testRequest.dates = [TEST_DATE_1, '2021-09-09']
    expect(await zendeskTicketDiffersFromRequest(testRequest)).toEqual(true)
    expect(logger.warn).toHaveBeenCalledWith(
      'Request does not match values on Ticket, the following parameters do not match:',
      { unmatchedParameters: ['date'] }
    )
  })

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
      expect(logger.warn).toHaveBeenCalledWith(
        'Request does not match values on Ticket, the following parameters do not match:',
        { unmatchedParameters: [parameterName] }
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
      expect(logger.warn).toHaveBeenCalledWith(
        'Request does not match values on Ticket, the following parameters do not match:',
        { unmatchedParameters: [parameterName] }
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
