// Under test
import {
  updateZendeskTicket,
  updateZendeskTicketById
} from './updateZendeskTicket'
// Dependencies
import { exampleEventBody } from '../../utils/tests/events/exampleEventBody'
import {
  ALL_ZENDESK_SECRETS,
  ZENDESK_TICKET_ID,
  ENCODED_AUTH_VALUE
} from '../../../common/utils/tests/testConstants'
import { givenAllSecretsAvailable } from '../../utils/tests/mocks/retrieveSecretKeys'
import * as mockHttpsRequestUtils from '../../utils/tests/mocks/httpsRequestUtils'
import { logger } from '../logger'

const zendeskTicketMessage = 'Something was invalid.'
const NEW_TICKET_STATUS = 'closed'

jest.mock('../secrets/retrieveZendeskApiSecrets', () => ({
  retrieveZendeskApiSecrets: jest.fn()
}))

jest.mock('../http/httpsRequestUtils', () => ({
  base64Encode: jest.fn(),
  makeHttpsRequest: jest.fn()
}))

describe('updating a zendesk ticket', () => {
  beforeEach(() => {
    givenAllSecretsAvailable()
    mockHttpsRequestUtils.givenAuthTokenGenerated()
    jest.spyOn(logger, 'info')
    jest.spyOn(logger, 'error')
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
      ZENDESK_TICKET_ID,
      zendeskTicketMessage,
      NEW_TICKET_STATUS
    )

    expectSuccessfulApiCallToBeMade()
  })

  const expectSuccessfulApiCallToBeMade = () => {
    expect(mockHttpsRequestUtils.mockBase64Encode.mock.calls.length).toBe(1)
    expect(mockHttpsRequestUtils.mockBase64Encode).toHaveBeenCalledWith(
      `${ALL_ZENDESK_SECRETS.zendeskApiUserEmail}/token:${ALL_ZENDESK_SECRETS.zendeskApiKey}`
    )
    expect(mockHttpsRequestUtils.mockMakeHttpsRequest.mock.calls.length).toBe(1)
    expect(mockHttpsRequestUtils.mockMakeHttpsRequest).toHaveBeenCalledWith(
      {
        method: 'PUT',
        hostname: 'example-host.zendesk.com',
        path: `/api/v2/tickets/${ZENDESK_TICKET_ID}`,
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
            author_id: ALL_ZENDESK_SECRETS.zendeskApiUserId
          }
        }
      }
    )
  }
  it('a single api call fails', async () => {
    mockHttpsRequestUtils.givenUnsuccessfulApiCall()

    await updateZendeskTicket(exampleEventBody, zendeskTicketMessage)
    expect(mockHttpsRequestUtils.mockMakeHttpsRequest).toThrow(Error)
    expect(logger.error).toHaveBeenLastCalledWith(
      'Zendesk ticket update failed.',
      Error('There was an error.')
    )
  })

  it('a single api call fails with zendesk ID', async () => {
    mockHttpsRequestUtils.givenUnsuccessfulApiCall()

    await updateZendeskTicketById(ZENDESK_TICKET_ID, zendeskTicketMessage)
    expect(mockHttpsRequestUtils.mockMakeHttpsRequest).toThrow(Error)
    expect(logger.error).toHaveBeenLastCalledWith(
      'Zendesk ticket update failed.',
      Error('There was an error.')
    )
  })

  it('returns from the function if eventBody is null', async () => {
    await updateZendeskTicket(null, zendeskTicketMessage)
    expect(logger.error).toHaveBeenLastCalledWith(
      'No Zendesk info available. Cannot update ticket.'
    )
  })

  it('returns from the function if Zendesk Ticket ID is not set', async () => {
    await updateZendeskTicket("{zendeskId: ''}", zendeskTicketMessage)
    expect(logger.error).toHaveBeenLastCalledWith(
      'No Zendesk ticket ID present. Cannot update ticket.'
    )
  })

  it('returns from the function if Zendesk Ticket ID key is not present', async () => {
    await updateZendeskTicket("{someOtherKey: ''}", zendeskTicketMessage)
    expect(logger.error).toHaveBeenLastCalledWith(
      'No Zendesk ticket ID present. Cannot update ticket.'
    )
  })

  it('returns from the function if eventBody is not JSON', async () => {
    await updateZendeskTicket('hello', zendeskTicketMessage)
    expect(logger.error).toHaveBeenCalledWith('Error parsing JSON')
    expect(logger.error).toHaveBeenLastCalledWith(
      'No Zendesk ticket ID present. Cannot update ticket.'
    )
  })
})
