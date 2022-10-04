import { givenAllSecretsAvailable } from '../utils/tests/mocks/retrieveSecretKeys'
import * as mockHttpsRequestUtils from '../utils/tests/mocks/httpsRequestUtils'
import { getZendeskTicket } from './getZendeskTicket'
import {
  ALL_ZENDESK_SECRETS,
  ENCODED_AUTH_VALUE,
  ZENDESK_TICKET_ID
} from '../utils/tests/testConstants'

jest.mock('../secrets/retrieveZendeskApiSecrets', () => ({
  retrieveZendeskApiSecrets: jest.fn()
}))

jest.mock('./httpsRequestUtils', () => ({
  base64Encode: jest.fn(),
  makeHttpsRequest: jest.fn()
}))

const successResponse = {
  ticket: {
    id: ZENDESK_TICKET_ID,
    requester_id: '123',
    custom_fields: [
      {
        id: '123',
        value: 'test'
      }
    ]
  }
}

const invalidResponse = {
  ticket: {
    id: ZENDESK_TICKET_ID,
    requester_id: '123'
  }
}

describe('get zendesk ticket information', () => {
  beforeEach(() => {
    givenAllSecretsAvailable()
    mockHttpsRequestUtils.givenAuthTokenGenerated()
    jest.spyOn(global.console, 'log')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('show ticket call succeeds', async () => {
    mockHttpsRequestUtils.givenSuccessfulApiCall(successResponse)
    await getZendeskTicket(ZENDESK_TICKET_ID)

    expectSuccessfulApiCallToBeMade()

    expect(console.log).toHaveBeenLastCalledWith(
      'Zendesk ticket with matching id found',
      successResponse.ticket
    )
  })

  test('throws error if response is not a zendesk ticket', async () => {
    mockHttpsRequestUtils.givenSuccessfulApiCall(invalidResponse)

    const error = async () => {
      await getZendeskTicket(ZENDESK_TICKET_ID)
    }

    await expect(error()).rejects.toThrow(
      'The returned data was not a Zendesk ticket'
    )
  })

  test('show ticket call fails', async () => {
    mockHttpsRequestUtils.givenUnsuccessfulApiCall()

    const error = async () => {
      await getZendeskTicket(ZENDESK_TICKET_ID)
    }
    await expect(error()).rejects.toThrow('There was an error.')
  })
})

const expectSuccessfulApiCallToBeMade = () => {
  expect(mockHttpsRequestUtils.mockBase64Encode.mock.calls.length).toBe(1)
  expect(mockHttpsRequestUtils.mockBase64Encode).toHaveBeenCalledWith(
    `${ALL_ZENDESK_SECRETS.zendeskApiUserEmail}/token:${ALL_ZENDESK_SECRETS.zendeskApiKey}`
  )
  expect(mockHttpsRequestUtils.mockMakeHttpsRequest.mock.calls.length).toBe(1)
  expect(mockHttpsRequestUtils.mockMakeHttpsRequest).toHaveBeenCalledWith({
    method: 'GET',
    hostname: 'example-host.zendesk.com',
    path: `/api/v2/tickets/${ZENDESK_TICKET_ID}`,
    headers: {
      Authorization: ENCODED_AUTH_VALUE
    }
  })
}
