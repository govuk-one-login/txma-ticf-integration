// Under test
import { updateZendeskTicket } from './updateZendeskTicket'
// Dependencies
import { makeHttpsRequest, base64Encode } from './httpsRequestUtils'
import { retrieveZendeskApiSecrets } from './retrieveZendeskApiSecrets'
import { ZendeskApiSecrets } from '../types/zendeskApiSecrets'
import { exampleEventBody } from '../utils/tests/events/exampleEventBody'
import { TICKET_ID } from '../utils/tests/testConstants'

const zendeskTicketMessage = 'Something was invalid.'
const encodedAuthValue = 'EncodedAuthValue'

jest.mock('./retrieveZendeskApiSecrets', () => ({
  retrieveZendeskApiSecrets: jest.fn()
}))
const mockRetrieveZendeskApiSecrets = retrieveZendeskApiSecrets as jest.Mock<
  Promise<ZendeskApiSecrets>
>
const givenSecretKeysSet = (secrets: ZendeskApiSecrets) => {
  mockRetrieveZendeskApiSecrets.mockResolvedValue(secrets)
}
const allSecretKeys: ZendeskApiSecrets = {
  zendeskApiKey: 'myZendeskApiKey',
  zendeskApiUserId: 'myZendeskApiUserId',
  zendeskApiUserEmail: 'my_zendesk@api-user.email.com'
}
const givenAllSecretsAvailable = () => {
  givenSecretKeysSet(allSecretKeys)
}

jest.mock('./httpsRequestUtils', () => ({
  base64Encode: jest.fn(),
  makeHttpsRequest: jest.fn()
}))
const mockBase64Encode = base64Encode as jest.Mock<string>
const givenAuthTokenGenerated = () => {
  mockBase64Encode.mockReturnValue(encodedAuthValue)
}
const mockMakeHttpsRequest = makeHttpsRequest as unknown as jest.Mock<void>
const givenSuccessfulApiCall = () => {
  mockMakeHttpsRequest.mockImplementation(() => {
    return { theReturnData: '123' }
  })
}
const givenUnsuccessfulApiCall = () => {
  mockMakeHttpsRequest.mockImplementation(() => {
    throw new Error('There was an error.')
  })
}

describe('updating a zendesk ticket', () => {
  beforeEach(() => {
    givenAllSecretsAvailable()
    givenAuthTokenGenerated()
    jest.spyOn(global.console, 'log')
    jest.spyOn(global.console, 'error')
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('a single api call was made', async () => {
    givenSuccessfulApiCall()
    const newTicketStatus = 'closed'
    await updateZendeskTicket(
      exampleEventBody,
      zendeskTicketMessage,
      newTicketStatus
    )

    expect(mockBase64Encode.mock.calls.length).toBe(1)
    expect(mockBase64Encode).toHaveBeenCalledWith(
      `${allSecretKeys.zendeskApiUserEmail}/token:${allSecretKeys.zendeskApiKey}`
    )
    expect(mockMakeHttpsRequest.mock.calls.length).toBe(1)
    expect(mockMakeHttpsRequest).toHaveBeenCalledWith(
      {
        method: 'PUT',
        hostname: 'example-host.zendesk.com',
        path: `/api/v2/tickets/${TICKET_ID}`,
        headers: {
          Authorization: encodedAuthValue,
          'Content-Type': 'application/json'
        }
      },
      {
        ticket: {
          status: newTicketStatus,
          comment: {
            body: zendeskTicketMessage,
            author_id: allSecretKeys.zendeskApiUserId
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
    givenUnsuccessfulApiCall()

    await updateZendeskTicket(exampleEventBody, zendeskTicketMessage)
    expect(mockMakeHttpsRequest).toThrow(Error)
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
