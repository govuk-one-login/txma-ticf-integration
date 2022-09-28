import { DataRequestParams } from '../types/dataRequestParams'
import { ZendeskTicket } from '../types/zendeskTicketResult'
import { ZendeskUser } from '../types/zendeskUser'
import {
  TEST_DATE_FROM,
  TEST_DATE_TO,
  ZENDESK_TICKET_ID
} from '../utils/tests/testConstants'
import {
  testDataRequest,
  testDataRequestWithUndefinedValues,
  testDataRequestWithValues
} from '../utils/tests/testDataRequest'
import { getZendeskTicket } from './getZendeskTicket'
import { getZendeskUser } from './getZendeskUser'
import { matchZendeskTicket } from './matchZendeskTicket'

jest.mock('./getZendeskTicket', () => ({
  getZendeskTicket: jest.fn()
}))

jest.mock('./getZendeskUser', () => ({
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
        id: ZENDESK_TICKET_ID,
        requester_id: '123',
        custom_fields: [
          {
            id: '1',
            value: null
          },
          {
            id: '2',
            value: TEST_DATE_FROM
          },
          {
            id: '3',
            value: TEST_DATE_TO
          },
          {
            id: '4',
            value: '123 456'
          },
          {
            id: '5',
            value: 'event_id'
          },
          {
            id: '6',
            value: null
          },
          {
            id: '7',
            value: 'passport_number'
          },
          {
            id: '8',
            value: null
          },
          {
            id: '9',
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

  const givenZendeskTicketDoesNotMatchValues = (
    parameterName: string,
    parameterValue: string | string[] | undefined
  ) => {
    mockGetZendeskTicket.mockImplementation(() =>
      Promise.resolve({
        id: ZENDESK_TICKET_ID,
        requester_id: '123',
        custom_fields: [
          {
            id: '1',
            value: 'path_to_data1 path_to_data2'
          },
          {
            id: '2',
            value: TEST_DATE_FROM
          },
          {
            id: '3',
            value: TEST_DATE_TO
          },
          {
            id: '4',
            value: '123 456'
          },
          {
            id: '5',
            value: 'event_id'
          },
          {
            id: '6',
            value: '123 456'
          },
          {
            id: '7',
            value: 'passport_number'
          },
          {
            id: '8',
            value: '123 456'
          },
          {
            id: '9',
            value: '123 456'
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
      testDataRequestWithValues
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
    parameterValue: string | string[] | undefined
  ) => {
    mockGetZendeskTicket.mockImplementation(() =>
      Promise.resolve({
        id: ZENDESK_TICKET_ID,
        requester_id: '123',
        custom_fields: [
          {
            id: '1',
            value: null
          },
          {
            id: '2',
            value: TEST_DATE_FROM
          },
          {
            id: '3',
            value: TEST_DATE_TO
          },
          {
            id: '4',
            value: null
          },
          {
            id: '5',
            value: 'event_id'
          },
          {
            id: '6',
            value: null
          },
          {
            id: '7',
            value: null
          },
          {
            id: '8',
            value: null
          },
          {
            id: '9',
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

    const newRequest = Object.assign(
      {},
      testDataRequestWithUndefinedValues
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
        id: ZENDESK_TICKET_ID,
        requester_id: '123',
        custom_fields: [
          {
            id: '2',
            value: TEST_DATE_FROM
          },
          {
            id: '3',
            value: TEST_DATE_TO
          },
          {
            id: '4',
            value: '123 456'
          },
          {
            id: '5',
            value: 'event_id'
          },
          {
            id: '6',
            value: null
          },
          {
            id: '7',
            value: 'passport_number'
          },
          {
            id: '8',
            value: null
          },
          {
            id: '9',
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

    const matchResult = await matchZendeskTicket(testDataRequest)

    expect(matchResult).toEqual(true)
  })

  test.each([
    ['zendeskId', '123456789'],
    ['resultsEmail', 'notmyemail@example.gov.uk'],
    ['resultsName', 'not my name'],
    ['identifierType', '123456789'],
    ['dataPaths', ['123456789']],
    ['dateFrom', '123456789'],
    ['dateTo', '123456789'],
    ['eventIds', ['123456789']],
    ['journeyIds', ['123456789']],
    ['piiTypes', ['123456789']]
  ])(
    '%p does not match given values',
    async (
      parameterName: string,
      parameterValue: string | string[] | undefined
    ) => {
      const request = givenZendeskTicketDoesNotMatchValues(
        parameterName,
        parameterValue
      )

      const matchResult = await matchZendeskTicket(request)

      expect(matchResult).toEqual(false)
      expect(console.warn).toHaveBeenCalledWith(
        'Request does not match values on Ticket, the following parameters do not match:',
        [parameterName]
      )
    }
  )

  test.each([
    ['zendeskId', undefined],
    ['resultsEmail', undefined],
    ['resultsName', undefined],
    ['identifierType', undefined],
    ['dataPaths', undefined],
    ['dateFrom', undefined],
    ['dateTo', undefined],
    ['eventIds', undefined],
    ['journeyIds', undefined],
    ['piiTypes', undefined]
  ])(
    '%p does not match with missing request value',
    async (
      parameterName: string,
      parameterValue: string | string[] | undefined
    ) => {
      const request = givenZendeskTicketDoesNotMatchValues(
        parameterName,
        parameterValue
      )

      const matchResult = await matchZendeskTicket(request)

      expect(matchResult).toEqual(false)
      expect(console.warn).toHaveBeenCalledWith(
        'Request does not match values on Ticket, the following parameters do not match:',
        [parameterName]
      )
    }
  )

  test.each([
    ['resultsEmail', 'notmyemail@example.gov.uk'],
    ['resultsName', 'not my name'],
    ['dataPaths', ['123456789']],
    ['eventIds', ['123456789']],
    ['journeyIds', ['123456789']],
    ['piiTypes', ['123456789']]
  ])(
    'does not match when ticket missing value %p',
    async (
      parameterName: string,
      parameterValue: string | string[] | undefined
    ) => {
      const request = givenZendeskTicketDoesNotMatchWhenMissingValues(
        parameterName,
        parameterValue
      )

      const matchResult = await matchZendeskTicket(request)

      expect(matchResult).toEqual(false)
      expect(console.warn).toHaveBeenCalledWith(
        'Request does not match values on Ticket, the following parameters do not match:',
        [parameterName]
      )
    }
  )

  test('custom field not found in ticket', async () => {
    givenCustomFieldNotFound()

    const error = async () => {
      await matchZendeskTicket(testDataRequest)
    }
    await expect(error()).rejects.toThrow('Custom field with id 1 not found')
  })
})
