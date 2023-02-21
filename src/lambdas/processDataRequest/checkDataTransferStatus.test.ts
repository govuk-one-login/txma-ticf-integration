import { sendContinuePollingDataTransferMessage } from '../../sharedServices/queue/sendContinuePollingDataTransferMessage'
import { checkS3BucketData } from '../../sharedServices/s3/checkS3BucketData'
import { startTransferToAnalysisBucket } from '../../sharedServices/bulkJobs/startTransferToAnalysisBucket'
import { sendInitiateAthenaQueryMessage } from '../../sharedServices/queue/sendInitiateAthenaQueryMessage'
import { incrementPollingRetryCount } from './incrementPollingRetryCount'
import { checkDataTransferStatus } from './checkDataTransferStatus'
import { when } from 'jest-when'
import {
  TEST_MAXIMUM_COPY_STATUS_CHECK_COUNT,
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

jest.mock('../../sharedServices/queue/sendInitiateAthenaQueryMessage', () => ({
  sendInitiateAthenaQueryMessage: jest.fn()
}))

const mockIncrementPollingRetryCount = incrementPollingRetryCount as jest.Mock
const mockSendContinuePollingDataTransferMessage =
  sendContinuePollingDataTransferMessage as jest.Mock

describe('checkDataTransferStatus', () => {
  const EXPECTED_DEFROST_WAIT_TIME_IN_SECONDS = 900
  const EXPECTED_COPY_WAIT_TIME_IN_SECONDS = 30

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

  const givenDataReadyForQuery = () => {
    givenDataResult([], [])
  }

  const givenDatabaseEntryResult = (
    statusCountObject:
      | { checkGlacierStatusCount?: number; checkCopyStatusCount?: number }
      | undefined = undefined
  ) => {
    when(getDatabaseEntryByZendeskId).mockResolvedValue({
      requestInfo: testDataRequest,
      ...(statusCountObject?.checkGlacierStatusCount && {
        checkGlacierStatusCount: statusCountObject.checkGlacierStatusCount
      }),
      ...(statusCountObject?.checkCopyStatusCount && {
        checkCopyStatusCount: statusCountObject.checkCopyStatusCount
      })
    } as DataRequestDatabaseEntry)
  }

  it('should continue polling if a glacier defrost is pending', async () => {
    const glacierRestoreIsInProgress = true
    const copyJobIsNotInProgress = false
    givenDatabaseEntryResult({
      checkGlacierStatusCount: 1
    })
    givenGlacierDefrostPending()

    await checkDataTransferStatus(ZENDESK_TICKET_ID)

    expect(logger.info).toHaveBeenLastCalledWith(
      'Placing zendeskId back on InitiateDataRequestQueue',
      {
        glacier_progress: 'Glacier restore still in progress',
        number_of_checks: '2'
      }
    )
    expect(mockIncrementPollingRetryCount).toBeCalledWith(
      ZENDESK_TICKET_ID,
      glacierRestoreIsInProgress,
      copyJobIsNotInProgress
    )
    expect(mockSendContinuePollingDataTransferMessage).toBeCalledWith(
      ZENDESK_TICKET_ID,
      EXPECTED_DEFROST_WAIT_TIME_IN_SECONDS
    )
    expect(mockIncrementPollingRetryCount).toHaveBeenCalledBefore(
      mockSendContinuePollingDataTransferMessage
    )
  })

  it('should start copy from audit to analysis bucket if no glacier defrost is pending, there are files to copy and no copy is in progress', async () => {
    const glacierRestoreIsNotInProgress = false
    const copyJobIsNotInProgress = false
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
    expect(mockIncrementPollingRetryCount).toBeCalledWith(
      ZENDESK_TICKET_ID,
      glacierRestoreIsNotInProgress,
      copyJobIsNotInProgress
    )
    expect(mockSendContinuePollingDataTransferMessage).toBeCalledWith(
      ZENDESK_TICKET_ID,
      EXPECTED_COPY_WAIT_TIME_IN_SECONDS
    )
    expect(mockIncrementPollingRetryCount).toHaveBeenCalledBefore(
      mockSendContinuePollingDataTransferMessage
    )
  })

  it('should continue to wait if there are pending files to copy from audit bucket and a copy has already started', async () => {
    const glacierRestoreIsNotInProgress = false
    const copyJobIsInProgress = true
    givenDatabaseEntryResult({
      checkCopyStatusCount: 1
    })
    givenCopyRequired()

    await checkDataTransferStatus(ZENDESK_TICKET_ID)

    expect(logger.info).toHaveBeenLastCalledWith(
      'Placing zendeskId back on InitiateDataRequestQueue',
      {
        glacier_progress: 'Copy job still in progress',
        number_of_checks: '2'
      }
    )
    expect(mockIncrementPollingRetryCount).toBeCalledWith(
      ZENDESK_TICKET_ID,
      glacierRestoreIsNotInProgress,
      copyJobIsInProgress
    )
    expect(mockSendContinuePollingDataTransferMessage).toBeCalledWith(
      ZENDESK_TICKET_ID,
      EXPECTED_COPY_WAIT_TIME_IN_SECONDS
    )
    expect(mockIncrementPollingRetryCount).toHaveBeenCalledBefore(
      mockSendContinuePollingDataTransferMessage
    )
  })

  it('should queue athena query if all data is now ready following a copy', async () => {
    givenDatabaseEntryResult({
      checkCopyStatusCount: 1
    })
    givenDataReadyForQuery()

    await checkDataTransferStatus(ZENDESK_TICKET_ID)
    expect(startTransferToAnalysisBucket).not.toHaveBeenCalled()
    expect(sendInitiateAthenaQueryMessage).toBeCalledWith(ZENDESK_TICKET_ID)
  })

  it('should queue athena query if all data is now ready following a glacier restore and copy', async () => {
    givenDatabaseEntryResult({
      checkGlacierStatusCount: 1,
      checkCopyStatusCount: 1
    })
    givenDataReadyForQuery()

    await checkDataTransferStatus(ZENDESK_TICKET_ID)

    expect(logger.info).toHaveBeenLastCalledWith(
      `Restore/copy process complete. Placing zendeskId '${ZENDESK_TICKET_ID}' on InitiateAthenaQueryQueue`
    )
    expect(sendInitiateAthenaQueryMessage).toBeCalledWith(ZENDESK_TICKET_ID)
  })

  it('should stop checking the data transfer status if checkCopyStatusCount exceeds maximum amount', async () => {
    givenDatabaseEntryResult({
      checkCopyStatusCount: TEST_MAXIMUM_COPY_STATUS_CHECK_COUNT
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
