import { type MockedFunction } from 'vitest'
import {
  base64Encode,
  makeHttpsRequest
} from '../../../sharedServices/http/httpsRequestUtils'
import { ENCODED_AUTH_VALUE } from '../testConstants'

export const mockMakeHttpsRequest =
  makeHttpsRequest as unknown as MockedFunction<typeof makeHttpsRequest>
export const mockBase64Encode = base64Encode as MockedFunction<
  typeof base64Encode
>

const givenApiCallResult = (result: Record<string, unknown> | Error) => {
  mockMakeHttpsRequest.mockImplementation(async () => {
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
