// Under test
import {
  updateZendeskTicket,
  updateZendeskTicketById
} from './updateZendeskTicket'
// Dependencies
import { vi } from 'vitest'
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

vi.mock('../secrets/retrieveZendeskApiSecrets', () => ({
  retrieveZendeskApiSecrets: vi.fn()
}))

vi.mock('../http/httpsRequestUtils', () => ({
  base64Encode: vi.fn(),
  makeHttpsRequest: vi.fn()
}))

describe('updating a zendesk ticket', () => {
  beforeEach(() => {
    givenAllSecretsAvailable()
    mockHttpsRequestUtils.givenAuthTokenGenerated()
    vi.spyOn(logger, 'info')
    vi.spyOn(logger, 'error')
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('a single api call was made with event body', async () => {
    // Unit Test
    mockHttpsRequestUtils.givenSuccessfulApiCall()
    await updateZendeskTicket(
      exampleEventBody,
      zendeskTicketMessage,
      NEW_TICKET_STATUS
    )

    expectSuccessfulApiCallToBeMade()
  })

  it('a single api call was made with zendesk ID', async () => {
    // Unit Test
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
    // Unit Test
    mockHttpsRequestUtils.givenUnsuccessfulApiCall()

    await updateZendeskTicket(exampleEventBody, zendeskTicketMessage)
    expect(logger.error).toHaveBeenLastCalledWith(
      'Zendesk ticket update failed.',
      Error('There was an error.')
    )
  })

  it('a single api call fails with zendesk ID', async () => {
    // Unit Test
    mockHttpsRequestUtils.givenUnsuccessfulApiCall()

    await updateZendeskTicketById(ZENDESK_TICKET_ID, zendeskTicketMessage)
    expect(logger.error).toHaveBeenLastCalledWith(
      'Zendesk ticket update failed.',
      Error('There was an error.')
    )
  })

  it('returns from the function if eventBody is null', async () => {
    // Unit Test
    await updateZendeskTicket(null, zendeskTicketMessage)
    expect(logger.error).toHaveBeenLastCalledWith(
      'No Zendesk info available. Cannot update ticket.'
    )
  })

  it('returns from the function if Zendesk Ticket ID is not set', async () => {
    // Unit Test
    await updateZendeskTicket("{zendeskId: ''}", zendeskTicketMessage)
    expect(logger.error).toHaveBeenLastCalledWith(
      'No Zendesk ticket ID present. Cannot update ticket.'
    )
  })

  it('returns from the function if Zendesk Ticket ID key is not present', async () => {
    // Unit Test
    await updateZendeskTicket("{someOtherKey: ''}", zendeskTicketMessage)
    expect(logger.error).toHaveBeenLastCalledWith(
      'No Zendesk ticket ID present. Cannot update ticket.'
    )
  })

  it('returns from the function if eventBody is not JSON', async () => {
    // Unit Test
    await updateZendeskTicket('hello', zendeskTicketMessage)
    expect(logger.error).toHaveBeenCalledWith('Error parsing JSON')
    expect(logger.error).toHaveBeenLastCalledWith(
      'No Zendesk ticket ID present. Cannot update ticket.'
    )
  })

  it('skips Zendesk update for manual request (MR-prefixed) ticket IDs', async () => {
    // Unit Test
    const manualRequestId = 'MRdpt-2904-2020-1'
    await updateZendeskTicketById(manualRequestId, zendeskTicketMessage)

    expect(logger.info).toHaveBeenCalledWith(
      `Skipping Zendesk ticket update for manual request with ID: ${manualRequestId}`
    )
    expect(mockHttpsRequestUtils.mockMakeHttpsRequest).not.toHaveBeenCalled()
  })

  it('skips Zendesk update for MR-prefixed ticket ID via updateZendeskTicket', async () => {
    // Unit Test
    const manualRequestBody = JSON.stringify({
      zendeskId: 'MRtest-123'
    })
    await updateZendeskTicket(manualRequestBody, zendeskTicketMessage)

    expect(logger.info).toHaveBeenCalledWith(
      'Skipping Zendesk ticket update for manual request with ID: MRtest-123'
    )
    expect(mockHttpsRequestUtils.mockMakeHttpsRequest).not.toHaveBeenCalled()
  })
})
