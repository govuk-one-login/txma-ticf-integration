import * as mockHttpsRequestUtils from '../../utils/tests/mocks/httpsRequestUtils'
import { givenAllSecretsAvailable } from '../../utils/tests/mocks/retrieveSecretKeys'
import {
  ALL_ZENDESK_SECRETS,
  ENCODED_AUTH_VALUE
} from '../../utils/tests/testConstants'
import { getZendeskUser } from './getZendeskUser'

jest.mock('../secrets/retrieveZendeskApiSecrets', () => ({
  retrieveZendeskApiSecrets: jest.fn()
}))

jest.mock('../http/httpsRequestUtils', () => ({
  base64Encode: jest.fn(),
  makeHttpsRequest: jest.fn()
}))

const successResponse = {
  user: {
    email: 'example@example.com',
    name: 'test'
  }
}
const userId = 123

describe('get zendesk ticket information', () => {
  beforeEach(() => {
    givenAllSecretsAvailable()
    mockHttpsRequestUtils.givenAuthTokenGenerated()
    jest.spyOn(global.console, 'log')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('show user call succeeds', async () => {
    mockHttpsRequestUtils.givenSuccessfulApiCall(successResponse)
    await getZendeskUser(userId)

    expectSuccessfulApiCallToBeMade()

    expect(console.log).toHaveBeenLastCalledWith(
      'Zendesk user with matching id found',
      successResponse.user
    )
  })

  test('show user call fails', async () => {
    mockHttpsRequestUtils.givenUnsuccessfulApiCall()

    const error = async () => {
      await getZendeskUser(userId)
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
    path: `/api/v2/users/${userId}.json`,
    headers: {
      Authorization: ENCODED_AUTH_VALUE
    }
  })
}
