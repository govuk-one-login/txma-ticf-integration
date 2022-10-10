import { handler } from './handler'
import { defaultApiRequest } from '../../utils/tests/events/defaultApiRequest'
import { validateZendeskRequest } from './validateZendeskRequest'
import {
  updateZendeskTicket,
  updateZendeskTicketById
} from '../../sharedServices/zendesk/updateZendeskTicket'
import { ValidatedDataRequestParamsResult } from '../../types/validatedDataRequestParamsResult'
import { DataRequestParams } from '../../types/dataRequestParams'
import { testDataRequest } from '../../utils/tests/testDataRequest'
import { isSignatureInvalid } from './validateRequestSource'
import { sendInitiateDataTransferMessage } from './sendInitiateDataTransferMessage'
import { zendeskTicketDiffersFromRequest } from './zendeskTicketDiffersFromRequest'

const mockValidateZendeskRequest =
  validateZendeskRequest as jest.Mock<ValidatedDataRequestParamsResult>

const mockUpdateZendeskTicket = updateZendeskTicket as jest.Mock

const mockUpdateZendeskTicketById = updateZendeskTicketById as jest.Mock

const mockIsSignatureInvalid = isSignatureInvalid as jest.Mock<Promise<boolean>>

const mockZendeskTicketDiffersFromRequest =
  zendeskTicketDiffersFromRequest as jest.Mock<Promise<boolean>>

const mockSendInitiateDataTransferMessage =
  sendInitiateDataTransferMessage as jest.Mock

jest.mock('./validateZendeskRequest', () => ({
  validateZendeskRequest: jest.fn()
}))

jest.mock('../../sharedServices/zendesk/updateZendeskTicket', () => ({
  updateZendeskTicket: jest.fn(),
  updateZendeskTicketById: jest.fn()
}))

jest.mock('./validateRequestSource', () => ({
  isSignatureInvalid: jest.fn()
}))

jest.mock('./zendeskTicketDiffersFromRequest', () => ({
  zendeskTicketDiffersFromRequest: jest.fn()
}))

jest.mock('./sendInitiateDataTransferMessage', () => ({
  sendInitiateDataTransferMessage: jest.fn()
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

  const givenSignatureValidationResult = (isValid: boolean) => {
    mockIsSignatureInvalid.mockImplementation(() => Promise.resolve(isValid))
  }

  const givenSignatureIsValid = () => {
    givenSignatureValidationResult(false)
  }

  const givenSignatureIsInvalid = () => {
    givenSignatureValidationResult(true)
  }

  const givenMatchZendeskTicketResult = (matches: boolean) => {
    mockZendeskTicketDiffersFromRequest.mockImplementation(() =>
      Promise.resolve(matches)
    )
  }

  const givenZendeskTicketDoesNotExist = () => {
    mockZendeskTicketDiffersFromRequest.mockImplementation(() => {
      throw new Error()
    })
  }

  const givenZendeskTicketDiffersFromRequest = () => {
    givenMatchZendeskTicketResult(true)
  }

  const givenZendeskTicketMatchesRequest = () => {
    givenMatchZendeskTicketResult(false)
  }

  const requestBody = 'myBody'
  const callHandlerWithBody = async () => {
    return await handler({
      ...defaultApiRequest,
      body: requestBody
    })
  }

  beforeEach(() => {
    mockSendInitiateDataTransferMessage.mockReset()
  })

  it('returns 200 response when request is valid and matches zendesk ticket', async () => {
    givenValidRequest()
    givenSignatureIsValid()
    givenZendeskTicketMatchesRequest()

    const handlerCallResult = await callHandlerWithBody()

    expect(handlerCallResult).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: 'data transfer initiated'
      })
    })
    expect(validateZendeskRequest).toHaveBeenCalledWith(requestBody)
    expect(mockSendInitiateDataTransferMessage).toHaveBeenCalledWith(
      testDataRequest
    )
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
    expect(sendInitiateDataTransferMessage).not.toHaveBeenCalled()
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
      `TEST: Your ticket has been closed because some fields were invalid. Here is the list of what was wrong: ${validationMessage}`,
      newTicketStatus
    )
  })

  it('returns 400 response when request is valid, but does not match zendesk ticket', async () => {
    const newTicketStatus = 'closed'
    givenValidRequest()
    givenSignatureIsValid()
    givenZendeskTicketDiffersFromRequest()

    const handlerCallResult = await callHandlerWithBody()

    expect(handlerCallResult).toEqual({
      statusCode: 400,
      body: JSON.stringify({
        message: 'Request parameters do not match a Zendesk Ticket'
      })
    })
    expect(zendeskTicketDiffersFromRequest).toHaveBeenCalledWith(
      testDataRequest
    )
    expect(mockUpdateZendeskTicketById).toBeCalledWith(
      testDataRequest.zendeskId,
      'Your ticket has been closed because a request was received for this ticket with details that do not match its current state.',
      newTicketStatus
    )
  })

  it('returns 400 response when zendesk ticket does not exist', async () => {
    givenValidRequest()
    givenSignatureIsValid()
    givenZendeskTicketDoesNotExist()

    const handlerCallResult = await callHandlerWithBody()

    expect(handlerCallResult).toEqual({
      statusCode: 404,
      body: JSON.stringify({
        message: 'Zendesk ticket not found'
      })
    })
  })
})
