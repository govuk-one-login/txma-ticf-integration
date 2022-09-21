// Under test
import { updateZendeskTicket } from './updateZendeskTicket'
// Dependencies
import { exampleEventBody } from '../utils/tests/events/exampleEventBody'
import {
  ALL_ZENDESK_SECRETS,
  TICKET_ID,
  ENCODED_AUTH_VALUE
} from '../utils/tests/testConstants'
import { givenAllSecretsAvailable } from '../utils/tests/mocks/retrieveSecretKeys'
import * as mockHttpsRequestUtils from '../utils/tests/mocks/httpsRequestUtils'

const zendeskTicketMessage = 'Something was invalid.'

jest.mock('../secrets/retrieveZendeskApiSecrets', () => ({
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

  it('a single api call was made', async () => {
    mockHttpsRequestUtils.givenSuccessfulApiCall()
    const newTicketStatus = 'closed'
    await updateZendeskTicket(
      exampleEventBody,
      zendeskTicketMessage,
      newTicketStatus
    )

    expect(mockHttpsRequestUtils.mockBase64Encode.mock.calls.length).toBe(1)
    expect(mockHttpsRequestUtils.mockBase64Encode).toHaveBeenCalledWith(
      `${ALL_ZENDESK_SECRETS.zendeskApiUserEmail}/token:${ALL_ZENDESK_SECRETS.zendeskApiKey}`
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
          status: newTicketStatus,
          comment: {
            body: zendeskTicketMessage,
            author_id: ALL_ZENDESK_SECRETS.zendeskApiUserId
          }
        }
      }
    )
    expect(console.log).toHaveBeenLastCalledWith(
      'Zendesk ticket validation update successful.',
      { theReturnData: '123' }
    )
  })

  it('a single api call fails', async () => {
    mockHttpsRequestUtils.givenUnsuccessfulApiCall()

    await updateZendeskTicket(exampleEventBody, zendeskTicketMessage)
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
