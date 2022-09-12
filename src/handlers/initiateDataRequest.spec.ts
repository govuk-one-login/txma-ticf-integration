import { handler } from './initiateDataRequest'
import { defaultApiRequest } from '../utils/tests/events/defaultApiRequest'
import { validateZendeskRequest } from '../services/validateZendeskRequest'
import { initiateDataTransfer } from '../services/initiateDataTransfer'
import { updateZendeskTicket } from '../services/updateZendeskTicket'
import { ValidatedDataRequestParamsResult } from '../types/validatedDataRequestParamsResult'
import { DataRequestParams } from '../types/dataRequestParams'
import { testDataRequest } from '../utils/tests/testDataRequest'
import { InitiateDataTransferResult } from '../types/initiateDataTransferResult'
import { isSignatureInvalid } from '../services/validateRequestSource'
const mockInitiateDataTransfer = initiateDataTransfer as jest.Mock<
  Promise<InitiateDataTransferResult>
>
const mockValidateZendeskRequest =
  validateZendeskRequest as jest.Mock<ValidatedDataRequestParamsResult>

const mockUpdateZendeskTicket = updateZendeskTicket as jest.Mock

const mockIsSignatureInvalid = isSignatureInvalid as jest.Mock<Promise<boolean>>

jest.mock('../services/validateZendeskRequest', () => ({
  validateZendeskRequest: jest.fn()
}))

jest.mock('../services/initiateDataTransfer', () => ({
  initiateDataTransfer: jest.fn()
}))

jest.mock('../services/updateZendeskTicket', () => ({
  updateZendeskTicket: jest.fn()
}))

jest.mock('../services/validateRequestSource', () => ({
  isSignatureInvalid: jest.fn()
}))

describe('initate data request handler', () => {
  const givenRequestValidationResult = (
    isValid: boolean,
    dataRequestParams?: DataRequestParams,
    validationMessage?: string
  ) => {
    mockValidateZendeskRequest.mockImplementation(() => ({
      isValid,
      dataRequestParams,
      validationMessage
    }))
  }

  const givenValidRequest = () => {
    givenRequestValidationResult(true, testDataRequest)
  }

  const givenDataResult = (success: boolean, errorMessage?: string) => {
    mockInitiateDataTransfer.mockImplementation(() =>
      Promise.resolve({ success, errorMessage: errorMessage })
    )
  }

  const givenDataAvailable = () => {
    givenDataResult(true)
  }

  const givenNoDataAvailable = (errorMessage: string) => {
    givenDataResult(false, errorMessage)
  }

  const givenSignatureValidationResult = (isValid: boolean) => {
    mockIsSignatureInvalid.mockImplementation(() => Promise.resolve(isValid))
  }

  const givenSignatureIsValid = () => {
    givenSignatureValidationResult(false)
  }

  const givenSignatureIsInvalid = () => {
    givenSignatureValidationResult(true)
  }

  const requestBody = 'myBody'
  const callHandlerWithBody = async () => {
    return await handler({
      ...defaultApiRequest,
      body: requestBody
    })
  }
  it('returns 200 response when request is valid and data found', async () => {
    givenValidRequest()
    givenDataAvailable()
    givenSignatureIsValid()

    const handlerCallResult = await callHandlerWithBody()

    expect(handlerCallResult).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: 'data transfer initiated'
      })
    })

    expect(validateZendeskRequest).toHaveBeenCalledWith(requestBody)
    expect(initiateDataTransfer).toHaveBeenCalledWith(testDataRequest)
  })

  it('returns 400 response when request signature is invalid', async () => {
    jest.spyOn(global.console, 'warn')
    givenSignatureIsInvalid()

    const handlerCallResult = await callHandlerWithBody()

    expect(handlerCallResult).toEqual({
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid request source'
      })
    })
    expect(console.warn).toHaveBeenLastCalledWith(
      'Request received with invalid webhook signature'
    )
  })

  it('returns 400 response when request body is invalid', async () => {
    const validationMessage = 'my validation message'
    const newTicketStatus = 'closed'
    givenRequestValidationResult(false, undefined, validationMessage)
    givenSignatureIsValid()

    const handlerCallResult = await callHandlerWithBody()

    expect(handlerCallResult).toEqual({
      statusCode: 400,
      body: JSON.stringify({
        message: validationMessage
      })
    })
    expect(validateZendeskRequest).toHaveBeenCalledWith(requestBody)
    expect(mockUpdateZendeskTicket).toHaveBeenCalledWith(
      requestBody,
      validationMessage,
      newTicketStatus
    )
  })

  it('returns 400 response when no data available', async () => {
    const noDataAvailableErrorMessage = 'my no data available message'
    givenValidRequest()
    givenSignatureIsValid()
    givenNoDataAvailable(noDataAvailableErrorMessage)

    const handlerCallResult = await callHandlerWithBody()

    expect(handlerCallResult).toEqual({
      statusCode: 400,
      body: JSON.stringify({
        message: noDataAvailableErrorMessage
      })
    })
  })
})
