import { handler } from './initiateDataRequest'
import { defaultApiRequest } from '../testUtils/events/defaultApiRequest'
import { validateZendeskRequest } from '../services/validateZendeskRequest'
import { initiateDataTransfer } from '../services/initiateDataTransfer'
import { ValidatedDataRequestParamsResult } from '../types/validatedDataRequestParamsResult'
import { DataRequestParams } from '../types/dataRequestParams'
const mockInitiateDataTransfer = initiateDataTransfer as jest.Mock<
  Promise<boolean>
>
const mockValidateZendeskRequest =
  validateZendeskRequest as jest.Mock<ValidatedDataRequestParamsResult>

jest.mock('../services/validateZendeskRequest', () => ({
  validateZendeskRequest: jest.fn()
}))

jest.mock('../services/initiateDataTransfer', () => ({
  initiateDataTransfer: jest.fn()
}))

const mockDataRequestParams = { zendeskTicketId: '' }

describe('initate data request handler', () => {
  const givenRequestValidationResult = (
    isValid: boolean,
    dataRequestParams?: DataRequestParams
  ) => {
    mockValidateZendeskRequest.mockImplementation(() => ({
      isValid: isValid,
      dataRequestParams: dataRequestParams
    }))
  }

  const givenValidRequest = () => {
    givenRequestValidationResult(true, mockDataRequestParams)
  }

  const givenDataAvailable = () => {
    mockInitiateDataTransfer.mockImplementation(() => Promise.resolve(true))
  }

  it('returns 200 response when request is valid and data found', async () => {
    givenValidRequest()
    givenDataAvailable()
    const requestBody = 'myBody'
    const result = await handler({
      ...defaultApiRequest,
      path: '/zendesk-webhook',
      body: requestBody
    })

    expect(validateZendeskRequest).toHaveBeenCalledWith(requestBody)
    expect(initiateDataTransfer).toHaveBeenCalledWith(mockDataRequestParams)
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: 'data transfer initiated'
      })
    })
  })
})
