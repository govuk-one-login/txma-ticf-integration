import {
  base64Encode,
  makeHttpsRequest
} from '../../../sharedServices/http/httpsRequestUtils'
import { ENCODED_AUTH_VALUE } from '../testConstants'

export const mockMakeHttpsRequest =
  makeHttpsRequest as unknown as jest.Mock<void>
export const mockBase64Encode = base64Encode as jest.Mock<string>

const givenApiCallResult = (result: Record<string, unknown> | Error) => {
  mockMakeHttpsRequest.mockImplementation(() => {
    if (result instanceof Error) throw result
    return result
  })
}
export const givenSuccessfulApiCall = (
  response: Record<string, unknown> = { theReturnData: '123' }
) => {
  givenApiCallResult(response)
}
export const givenUnsuccessfulApiCall = () => {
  givenApiCallResult(new Error('There was an error.'))
}
export const givenAuthTokenGenerated = () => {
  mockBase64Encode.mockReturnValue(ENCODED_AUTH_VALUE)
}
