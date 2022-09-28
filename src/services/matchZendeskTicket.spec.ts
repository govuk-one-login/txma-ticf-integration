import { ZendeskTicket } from '../types/zendeskTicketResult'
import { ZendeskUser } from '../types/zendeskUser'
import {
  TEST_DATE_FROM,
  TEST_DATE_TO,
  ZENDESK_TICKET_ID
} from '../utils/tests/testConstants'
import { testDataRequest } from '../utils/tests/testDataRequest'
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

  const givenZendeskTicketDoesNotMatch = () => {
    mockGetZendeskTicket.mockImplementation(() =>
      Promise.resolve({
        id: '1234',
        requester_id: '123',
        custom_fields: [
          {
            id: '1',
            value: '123'
          },
          {
            id: '2',
            value: '2019-10-12'
          },
          {
            id: '3',
            value: '2022-10-12'
          },
          {
            id: '4',
            value: '456 678'
          },
          {
            id: '5',
            value: 'event_id'
          },
          {
            id: '6',
            value: '123'
          },
          {
            id: '7',
            value: 'passport_number name'
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
        email: 'notmyuser@test.gov.uk',
        name: 'not my name'
      })
    )
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

  test('ticket and request do not match', async () => {
    givenZendeskTicketDoesNotMatch()

    const matchResult = await matchZendeskTicket(testDataRequest)

    expect(matchResult).toEqual(false)
    expect(console.warn).toHaveBeenCalledWith(
      'Request does not match values on Ticket, the following parameters do not match:',
      [
        'zendeskId',
        'resultsEmail',
        'resultsName',
        'dataPaths',
        'dateFrom',
        'dateTo',
        'eventIds',
        'journeyIds',
        'piiTypes'
      ]
    )
  })

  test('custom field not found in ticket', async () => {
    givenCustomFieldNotFound()

    const error = async () => {
      await matchZendeskTicket(testDataRequest)
    }
    await expect(error()).rejects.toThrow('Custom field with id 1 not found')
  })
})
