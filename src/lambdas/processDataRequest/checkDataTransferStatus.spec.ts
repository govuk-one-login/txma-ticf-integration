import { sendContinuePollingDataTransferMessage } from '../../sharedServices/queue/sendContinuePollingDataTransferMessage'
import { checkS3BucketData } from '../../sharedServices/s3/checkS3BucketData'
import { startCopyJob } from '../../sharedServices/bulkJobs/startCopyJob'
import { sendInitiateAthenaQueryMessage } from '../../sharedServices/queue/sendInitiateAthenaQueryMessage'
import { incrementPollingRetryCount } from './incrementPollingRetryCount'
import { checkDataTransferStatus } from './checkDataTransferStatus'
import { when } from 'jest-when'
import {
  TEST_MAXIMUM_STATUS_CHECK_COUNT,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'
import { DataRequestDatabaseEntry } from '../../types/dataRequestDatabaseEntry'
import { getDatabaseEntryByZendeskId } from '../../sharedServices/dynamoDB/dynamoDBGet'
import { DataRequestParams } from '../../types/dataRequestParams'
import { terminateStatusCheckProcess } from './terminateStatusCheckProcess'

jest.mock('../../sharedServices/dynamoDB/dynamoDBGet', () => ({
  getDatabaseEntryByZendeskId: jest.fn()
}))

jest.mock('../../sharedServices/s3/checkS3BucketData', () => ({
  checkS3BucketData: jest.fn()
}))

jest.mock('./terminateStatusCheckProcess', () => ({
  terminateStatusCheckProcess: jest.fn()
}))

jest.mock('../../sharedServices/bulkJobs/startCopyJob', () => ({
  startCopyJob: jest.fn()
}))

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

describe('checkDataTransferStatus', () => {
  const EXPECTED_DEFROST_WAIT_TIME_IN_SECONDS = 900
  const EXPECTED_COPY_WAIT_TIME_IN_SECONDS = 30

  beforeAll(() => {
    jest.resetAllMocks()
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

  const requestInfo: DataRequestParams = {
    zendeskId: ZENDESK_TICKET_ID,
    resultsEmail: 'test@test.gov.uk',
    resultsName: 'Test Name',
    dateTo: '2022-09-06',
    dateFrom: '2022-09-06',
    identifierType: 'event_id',
    eventIds: ['234gh24', '98h98bc'],
    piiTypes: ['passport_number'],
    sessionIds: [],
    journeyIds: [],
    userIds: [],
    dataPaths: []
  }

  const givenDatabaseEntryResult = (
    statusCountObject:
      | { checkGlacierStatusCount?: number; checkCopyStatusCount?: number }
      | undefined = undefined
  ) => {
    when(getDatabaseEntryByZendeskId).mockResolvedValue({
      requestInfo,
      ...(statusCountObject?.checkGlacierStatusCount && {
        checkGlacierStatusCount: statusCountObject.checkGlacierStatusCount
      }),
      ...(statusCountObject?.checkCopyStatusCount && {
        checkCopyStatusCount: statusCountObject.checkCopyStatusCount
      })
    } as DataRequestDatabaseEntry)
  }

  it('should continue polling if a glacier defrost is pending', async () => {
    givenDatabaseEntryResult({
      checkGlacierStatusCount: 1
    })
    givenGlacierDefrostPending()

    await checkDataTransferStatus(ZENDESK_TICKET_ID)

    expect(sendContinuePollingDataTransferMessage).toBeCalledWith(
      ZENDESK_TICKET_ID,
      EXPECTED_DEFROST_WAIT_TIME_IN_SECONDS
    )
    expect(incrementPollingRetryCount).toBeCalledWith({
      glacierRestoreStillInProgress: true,
      copyJobStillInProgress: false
    })
  })

  it('should start copy from audit to analysis bucket if no glacier defrost is pending, there are files to copy and no copy is in progress', async () => {
    givenDatabaseEntryResult({
      checkGlacierStatusCount: 1
    })
    givenCopyRequired()

    await checkDataTransferStatus(ZENDESK_TICKET_ID)

    expect(startCopyJob).toBeCalledWith(filesToCopy, ZENDESK_TICKET_ID)
    expect(sendContinuePollingDataTransferMessage).toBeCalledWith(
      ZENDESK_TICKET_ID,
      EXPECTED_COPY_WAIT_TIME_IN_SECONDS
    )
    expect(incrementPollingRetryCount).toBeCalledWith({
      glacierRestoreStillInProgress: false,
      copyJobStillInProgress: false
    })
  })

  it('should continue to wait if there are pending files to copy from audit bucket and a copy has already started', async () => {
    givenDatabaseEntryResult({
      checkCopyStatusCount: 1
    })
    givenCopyRequired()

    await checkDataTransferStatus(ZENDESK_TICKET_ID)

    expect(sendContinuePollingDataTransferMessage).toBeCalledWith(
      ZENDESK_TICKET_ID,
      EXPECTED_COPY_WAIT_TIME_IN_SECONDS
    )
    expect(incrementPollingRetryCount).toBeCalledWith({
      glacierRestoreStillInProgress: false,
      copyJobStillInProgress: true
    })
  })

  it('should queue athena query if all data is now ready', async () => {
    givenDatabaseEntryResult({
      checkGlacierStatusCount: 1,
      checkCopyStatusCount: 1
    })
    givenDataReadyForQuery()

    await checkDataTransferStatus(ZENDESK_TICKET_ID)

    expect(sendInitiateAthenaQueryMessage).toBeCalledWith(ZENDESK_TICKET_ID)
  })

  it('should stop checking the data transfer status if checkCopyStatusCount exceeds maximum amount', async () => {
    jest.spyOn(global.console, 'error')
    givenDatabaseEntryResult({
      checkCopyStatusCount: TEST_MAXIMUM_STATUS_CHECK_COUNT
    })

    await checkDataTransferStatus(ZENDESK_TICKET_ID)

    expect(console.error).toHaveBeenLastCalledWith(
      'Status check count exceeded. Process terminated'
    )
    expect(terminateStatusCheckProcess).toHaveBeenCalledWith(ZENDESK_TICKET_ID)
  })
  it('should stop checking the data transfer status if checkGlacierStatusCount exceeds maximum amount', async () => {
    jest.spyOn(global.console, 'error')
    givenDatabaseEntryResult({
      checkGlacierStatusCount: TEST_MAXIMUM_STATUS_CHECK_COUNT
    })

    await checkDataTransferStatus(ZENDESK_TICKET_ID)

    expect(console.error).toHaveBeenLastCalledWith(
      'Status check count exceeded. Process terminated'
    )
    expect(terminateStatusCheckProcess).toHaveBeenCalledWith(ZENDESK_TICKET_ID)
  })
})
