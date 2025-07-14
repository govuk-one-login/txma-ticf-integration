import { when } from 'jest-when'
import { SendManualQueryPayload } from '../types/sendManualQueryPayload'
import * as copyManualRequestDataImportHelper from './copyManualRequestData'
import { copyManualRequestData } from './copyManualRequestData'
import { sendAuditDataAction } from './sendAuditDataAction'
import * as sendSQSMessageToCompletedQueueImportHelper from './sendSQSMessageToCompletedQueue'
import { sendSQSMessageToCompletedQueue } from './sendSQSMessageToCompletedQueue'

const payload = {
  environment: 'dev',
  athenaQueryId: 'athenaId123',
  recipientEmail: 'email@example.com',
  recipientName: 'Name name',
  zendeskId: 'zendeskId123'
}

jest.mock('./copyManualRequestData', () => ({
  copyManualRequestData: jest.fn()
}))

jest.mock('./sendSQSMessageToCompletedQueue', () => ({
  sendSQSMessageToCompletedQueue: jest.fn()
}))

describe('testing the sendAuditData cli action', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
    jest.spyOn(copyManualRequestDataImportHelper, 'copyManualRequestData')
    jest.spyOn(
      sendSQSMessageToCompletedQueueImportHelper,
      'sendSQSMessageToCompletedQueue'
    )
  })

  it('copyManualRequestData(): failed', async () => {
    when(copyManualRequestData).mockRejectedValue('error')
    when(sendSQSMessageToCompletedQueue).mockResolvedValue()

    await expect(sendAuditDataAction(payload)).rejects.toThrow(
      'Failed to copy data within output bucket'
    )
    expect(copyManualRequestData).toHaveBeenCalledWith(
      payload.environment,
      payload.athenaQueryId
    )
  })

  it('copyManualRequestData(): sucess, sendSQSMessageToCompletedQueue(): fail', async () => {
    when(copyManualRequestData).mockResolvedValue()
    when(sendSQSMessageToCompletedQueue).mockRejectedValue('error')

    await expect(sendAuditDataAction(payload)).rejects.toThrow(
      'Failed to send payload to query completed queue'
    )
    expect(copyManualRequestData).toHaveBeenCalledWith(
      payload.environment,
      payload.athenaQueryId
    )
  })

  it('copyManualRequestData(): sucess, sendSQSMessageToCompletedQueue(): success', async () => {
    when(copyManualRequestData).mockResolvedValue()
    when(sendSQSMessageToCompletedQueue).mockResolvedValue()

    await sendAuditDataAction(payload)
    expect(copyManualRequestData).toHaveBeenCalledWith(
      payload.environment,
      payload.athenaQueryId
    )
    const completedQueuePayload: SendManualQueryPayload = {
      athenaQueryId: payload.athenaQueryId,
      recipientEmail: payload.recipientEmail,
      recipientName: payload.recipientName,
      zendeskTicketId: payload.zendeskId
    }
    expect(sendSQSMessageToCompletedQueue).toHaveBeenCalledWith(
      payload.environment,
      completedQueuePayload
    )
  })
})
