import { vi } from 'vitest'
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

vi.mock('./copyManualRequestData', () => ({
  copyManualRequestData: vi.fn()
}))

vi.mock('./sendSQSMessageToCompletedQueue', () => ({
  sendSQSMessageToCompletedQueue: vi.fn()
}))

describe('testing the sendAuditData cli action', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.clearAllMocks()
    vi.spyOn(copyManualRequestDataImportHelper, 'copyManualRequestData')
    vi.spyOn(
      sendSQSMessageToCompletedQueueImportHelper,
      'sendSQSMessageToCompletedQueue'
    )
  })

  it('copyManualRequestData(): failed', async () => {
    // Unit Test
    vi.mocked(copyManualRequestData).mockRejectedValue('error')
    vi.mocked(sendSQSMessageToCompletedQueue).mockResolvedValue()

    await expect(sendAuditDataAction(payload)).rejects.toThrow(
      'Failed to copy data within output bucket'
    )
    expect(copyManualRequestData).toHaveBeenCalledWith(
      payload.environment,
      payload.athenaQueryId
    )
  })

  it('copyManualRequestData(): success, sendSQSMessageToCompletedQueue(): fail', async () => {
    // Unit Test
    vi.mocked(copyManualRequestData).mockResolvedValue()
    vi.mocked(sendSQSMessageToCompletedQueue).mockRejectedValue('error')

    await expect(sendAuditDataAction(payload)).rejects.toThrow(
      'Failed to send payload to query completed queue'
    )
    expect(copyManualRequestData).toHaveBeenCalledWith(
      payload.environment,
      payload.athenaQueryId
    )
  })

  it('copyManualRequestData(): success, sendSQSMessageToCompletedQueue(): success', async () => {
    // Unit Test
    vi.mocked(copyManualRequestData).mockResolvedValue()
    vi.mocked(sendSQSMessageToCompletedQueue).mockResolvedValue()

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
