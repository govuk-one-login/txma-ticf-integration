import { sendContinuePollingDataTransferMessage } from '../../sharedServices/queue/sendContinuePollingDataTransferMessage'
import { checkS3BucketData } from '../../sharedServices/s3/checkS3BucketData'
import { startTransferToAnalysisBucket } from '../../sharedServices/bulkJobs/startTransferToAnalysisBucket'
import { incrementPollingRetryCount } from './incrementPollingRetryCount'
import { checkDataTransferStatus } from './checkDataTransferStatus'
import { when } from 'jest-when'
import {
  TEST_MAXIMUM_GLACIER_STATUS_CHECK_COUNT,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'
import { DataRequestDatabaseEntry } from '../../types/dataRequestDatabaseEntry'
import { getDatabaseEntryByZendeskId } from '../../sharedServices/dynamoDB/dynamoDBGet'
import { terminateStatusCheckProcess } from './terminateStatusCheckProcess'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { logger } from '../../sharedServices/logger'
import { testDataRequest } from '../../utils/tests/testDataRequest'

jest.mock('../../sharedServices/dynamoDB/dynamoDBGet', () => ({
  getDatabaseEntryByZendeskId: jest.fn()
}))

jest.mock('../../sharedServices/s3/checkS3BucketData', () => ({
  checkS3BucketData: jest.fn()
}))

jest.mock('../../sharedServices/zendesk/updateZendeskTicket', () => ({
  updateZendeskTicketById: jest.fn()
}))

jest.mock('./terminateStatusCheckProcess', () => ({
  terminateStatusCheckProcess: jest.fn()
}))

jest.mock(
  '../../sharedServices/bulkJobs/startTransferToAnalysisBucket',
  () => ({
    startTransferToAnalysisBucket: jest.fn()
  })
)

jest.mock(
  '../../sharedServices/queue/sendContinuePollingDataTransferMessage',
  () => ({
    sendContinuePollingDataTransferMessage: jest.fn()
  })
)

jest.mock('./incrementPollingRetryCount', () => ({
  incrementPollingRetryCount: jest.fn()
}))

const mockIncrementPollingRetryCount = incrementPollingRetryCount as jest.Mock
const mockSendContinuePollingDataTransferMessage =
  sendContinuePollingDataTransferMessage as jest.Mock

describe('checkDataTransferStatus', () => {
  const EXPECTED_DEFROST_WAIT_TIME_IN_SECONDS = 900

  beforeEach(() => {
    jest.spyOn(logger, 'info')
    jest.spyOn(logger, 'error')
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  const givenDataResult = (
    standardTierLocationsToCopy: string[],
    glacierTierLocationsToCopy: string[]
  ) => {
    when(checkS3BucketData).mockResolvedValue({
      standardTierLocationsToCopy: standardTierLocationsToCopy,
      glacierTierLocationsToCopy: glacierTierLocationsToCopy,
      dataAvailable: true
    })
  }

  const filesToCopy = ['file-to-copy1', 'file-to-copy-2']

  const givenGlacierDefrostPending = () => {
    givenDataResult(filesToCopy, [
      'glacier-to-restore-1',
      'glacier-to-restore-2'
    ])
  }

  const givenCopyRequired = () => {
    givenDataResult(filesToCopy, [])
  }

  const givenDatabaseEntryResult = (
    statusCountObject:
      | { checkGlacierStatusCount?: number }
      | undefined = undefined
  ) => {
    when(getDatabaseEntryByZendeskId).mockResolvedValue({
      requestInfo: testDataRequest,
      ...(statusCountObject?.checkGlacierStatusCount && {
        checkGlacierStatusCount: statusCountObject.checkGlacierStatusCount
      })
    } as DataRequestDatabaseEntry)
  }

  it('should continue polling if a glacier defrost is pending', async () => {
    givenDatabaseEntryResult({
      checkGlacierStatusCount: 1
    })
    givenGlacierDefrostPending()

    await checkDataTransferStatus(ZENDESK_TICKET_ID)

    expect(logger.info).toHaveBeenLastCalledWith(
      'Placing zendeskId back on InitiateDataRequestQueue because Glacier restore is still in progress',
      {
        numberOfChecks: '2'
      }
    )
    expect(mockIncrementPollingRetryCount).toBeCalledWith(ZENDESK_TICKET_ID)
    expect(mockSendContinuePollingDataTransferMessage).toBeCalledWith(
      ZENDESK_TICKET_ID,
      EXPECTED_DEFROST_WAIT_TIME_IN_SECONDS
    )
    expect(mockIncrementPollingRetryCount).toHaveBeenCalledBefore(
      mockSendContinuePollingDataTransferMessage
    )
  })

  it('should start copy from audit to analysis bucket if no glacier defrost is pending, there are files to copy and no copy is in progress', async () => {
    givenDatabaseEntryResult({
      checkGlacierStatusCount: 1
    })
    givenCopyRequired()

    await checkDataTransferStatus(ZENDESK_TICKET_ID)

    expect(logger.info).toHaveBeenLastCalledWith(
      'Glacier restore complete. Starting copy job'
    )
    expect(startTransferToAnalysisBucket).toBeCalledWith(
      filesToCopy,
      ZENDESK_TICKET_ID
    )
    expect(mockSendContinuePollingDataTransferMessage).not.toBeCalled()
    expect(mockIncrementPollingRetryCount).not.toHaveBeenCalled()
  })

  it('should stop checking the data transfer status if checkGlacierStatusCount exceeds maximum amount', async () => {
    givenDatabaseEntryResult({
      checkGlacierStatusCount: TEST_MAXIMUM_GLACIER_STATUS_CHECK_COUNT
    })

    await checkDataTransferStatus(ZENDESK_TICKET_ID)

    expect(logger.error).toHaveBeenLastCalledWith(
      'Status check count exceeded. Process terminated'
    )
    expect(terminateStatusCheckProcess).toHaveBeenCalledWith(ZENDESK_TICKET_ID)
    expect(updateZendeskTicketById).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      'The data retrieval process timed out and could not be retrieved. Please try again by opening another ticket',
      'closed'
    )
  })
})
