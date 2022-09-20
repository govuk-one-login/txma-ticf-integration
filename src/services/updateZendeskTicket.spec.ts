// Under test
import {
  updateZendeskTicket,
  updateZendeskTicketById
} from './updateZendeskTicket'
// Dependencies
import { exampleEventBody } from '../utils/tests/events/exampleEventBody'
import {
  ALL_SECRET_KEYS,
  TICKET_ID,
  ENCODED_AUTH_VALUE
} from '../utils/tests/testConstants'
import { givenAllSecretsAvailable } from '../utils/tests/mocks/retrieveSecretKeys'
import * as mockHttpsRequestUtils from '../utils/tests/mocks/httpsRequestUtils'

const zendeskTicketMessage = 'Something was invalid.'
const NEW_TICKET_STATUS = 'closed'

jest.mock('./retrieveZendeskApiSecrets', () => ({
  retrieveZendeskApiSecrets: jest.fn()
}))

jest.mock('./httpsRequestUtils', () => ({
  base64Encode: jest.fn(),
  makeHttpsRequest: jest.fn()
}))

describe('updating a zendesk ticket', () => {
  beforeEach(() => {
    givenAllSecretsAvailable()
    mockHttpsRequestUtils.givenAuthTokenGenerated()
    jest.spyOn(global.console, 'log')
    jest.spyOn(global.console, 'error')
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('a single api call was made with event body', async () => {
    mockHttpsRequestUtils.givenSuccessfulApiCall()
    await updateZendeskTicket(
      exampleEventBody,
      zendeskTicketMessage,
      NEW_TICKET_STATUS
    )

    expectSuccessfulApiCallToBeMade()
  })

  it('a single api call was made with zendesk ID', async () => {
    mockHttpsRequestUtils.givenSuccessfulApiCall()
    await updateZendeskTicketById(
      TICKET_ID,
      zendeskTicketMessage,
      NEW_TICKET_STATUS
    )

    expectSuccessfulApiCallToBeMade()
  })

  const expectSuccessfulApiCallToBeMade = () => {
    expect(mockHttpsRequestUtils.mockBase64Encode.mock.calls.length).toBe(1)
    expect(mockHttpsRequestUtils.mockBase64Encode).toHaveBeenCalledWith(
      `${ALL_SECRET_KEYS.zendeskApiUserEmail}/token:${ALL_SECRET_KEYS.zendeskApiKey}`
    )
    expect(mockHttpsRequestUtils.mockMakeHttpsRequest.mock.calls.length).toBe(1)
    expect(mockHttpsRequestUtils.mockMakeHttpsRequest).toHaveBeenCalledWith(
      {
        method: 'PUT',
        hostname: 'example-host.zendesk.com',
        path: `/api/v2/tickets/${TICKET_ID}`,
        headers: {
          Authorization: ENCODED_AUTH_VALUE,
          'Content-Type': 'application/json'
        }
      },
      {
        ticket: {
          status: NEW_TICKET_STATUS,
          comment: {
            body: zendeskTicketMessage,
            author_id: ALL_SECRET_KEYS.zendeskApiUserId
          }
        }
      }
    )
    expect(console.log).toHaveBeenLastCalledWith(
      'Zendesk ticket validation update successful.',
      { theReturnData: '123' }
    )
  }
  it('a single api call fails', async () => {
    mockHttpsRequestUtils.givenUnsuccessfulApiCall()

    await updateZendeskTicket(exampleEventBody, zendeskTicketMessage)
    expect(mockHttpsRequestUtils.mockMakeHttpsRequest).toThrow(Error)
    expect(console.error).toHaveBeenLastCalledWith(
      'Zendesk ticket validation update failed.',
      Error('There was an error.')
    )
  })

  it('a single api call fails with zendesk ID', async () => {
    mockHttpsRequestUtils.givenUnsuccessfulApiCall()

    await updateZendeskTicketById(TICKET_ID, zendeskTicketMessage)
    expect(mockHttpsRequestUtils.mockMakeHttpsRequest).toThrow(Error)
    expect(console.error).toHaveBeenLastCalledWith(
      'Zendesk ticket validation update failed.',
      Error('There was an error.')
    )
  })

  it('returns from the function if eventBody is null', async () => {
    await updateZendeskTicket(null, zendeskTicketMessage)
    expect(console.error).toHaveBeenLastCalledWith(
      'No Zendesk info available. Cannot update ticket.'
    )
  })

  it('returns from the function if Zendesk Ticket ID is not set', async () => {
    await updateZendeskTicket("{zendeskId: ''}", zendeskTicketMessage)
    expect(console.error).toHaveBeenLastCalledWith(
      'No Zendesk ticket ID present. Cannot update ticket.'
    )
  })

  it('returns from the function if Zendesk Ticket ID key is not present', async () => {
    await updateZendeskTicket("{someOtherKey: ''}", zendeskTicketMessage)
    expect(console.error).toHaveBeenLastCalledWith(
      'No Zendesk ticket ID present. Cannot update ticket.'
    )
  })

  it('returns from the function if eventBody is not JSON', async () => {
    await updateZendeskTicket('hello', zendeskTicketMessage)
    expect(console.error).toHaveBeenCalledWith(
      'Error parsing JSON: ',
      new SyntaxError('Unexpected token h in JSON at position 0')
    )
    expect(console.error).toHaveBeenLastCalledWith(
      'No Zendesk ticket ID present. Cannot update ticket.'
    )
  })
})
