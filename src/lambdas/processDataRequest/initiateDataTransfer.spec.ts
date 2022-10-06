import { S3BucketDataLocationResult } from '../../types/s3BucketDataLocationResult'
import { checkS3BucketData } from '../../sharedServices/s3/checkS3BucketData'
import { initiateDataTransfer } from './initiateDataTransfer'
import { startGlacierRestore } from '../../sharedServices/bulkJobs/startGlacierRestore'
import { testDataRequest } from '../../utils/tests/testDataRequest'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { ZENDESK_TICKET_ID } from '../../utils/tests/testConstants'
import { addNewDataRequestRecord } from '../../sharedServices/dynamoDB/dynamoDBPut'
import { startCopyJob } from '../../sharedServices/bulkJobs/startCopyJob'
import { sendContinuePollingDataTransferMessage } from '../../sharedServices/queue/sendContinuePollingDataTransferMessage'
import { sendInitiateAthenaQueryMessage } from '../../sharedServices/queue/sendInitiateAthenaQueryMessage'

jest.mock('../../sharedServices/s3/checkS3BucketData', () => ({
  checkS3BucketData: jest.fn()
}))

const mockCheckS3BucketData = checkS3BucketData as jest.Mock<
  Promise<S3BucketDataLocationResult>
>

jest.mock('../../sharedServices/zendesk/updateZendeskTicket', () => ({
  updateZendeskTicketById: jest.fn()
}))

const mockUpdateZendeskTicketById = updateZendeskTicketById as jest.Mock

jest.mock('../../sharedServices/bulkJobs/startGlacierRestore', () => ({
  startGlacierRestore: jest.fn()
}))

const mockStartGlacierRestore = startGlacierRestore as jest.Mock

jest.mock('../../sharedServices/dynamoDB/dynamoDBPut', () => ({
  addNewDataRequestRecord: jest.fn()
}))

const mockAddNewDataRequestRecord = addNewDataRequestRecord as jest.Mock

jest.mock('../../sharedServices/bulkJobs/startCopyJob', () => ({
  startCopyJob: jest.fn()
}))

const mockStartCopyJob = startCopyJob as jest.Mock

jest.mock(
  '../../sharedServices/queue/sendContinuePollingDataTransferMessage',
  () => ({
    sendContinuePollingDataTransferMessage: jest.fn()
  })
)

jest.mock('../../sharedServices/queue/sendInitiateAthenaQueryMessage', () => ({
  sendInitiateAthenaQueryMessage: jest.fn()
}))

const mockSendContinuePollingDataTransferMessage =
  sendContinuePollingDataTransferMessage as jest.Mock

describe('initiate data transfer', () => {
  const givenDataResult = (
    dataAvailable: boolean,
    standardTierLocationsToCopy: string[],
    glacierTierLocationsToCopy: string[]
  ) => {
    mockCheckS3BucketData.mockResolvedValue({
      standardTierLocationsToCopy: standardTierLocationsToCopy,
      glacierTierLocationsToCopy: glacierTierLocationsToCopy,
      dataAvailable
    })
  }

  const givenNoDataAvailable = () => {
    givenDataResult(false, [], [])
  }

  const givenDataAvailable = () => {
    givenDataResult(true, [], [])
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls Zendesk to close ticket if no data can be found for the requested parameters', async () => {
    givenNoDataAvailable()
    await initiateDataTransfer(testDataRequest)
    expect(mockCheckS3BucketData).toHaveBeenCalledWith(testDataRequest)
    expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      'Your ticket has been closed because no data was available for the requested dates',
      'closed'
    )
  })

  it('stores a record to the data request database and sends a message to the Athena queue when data is ready to go', async () => {
    givenDataAvailable()
    await initiateDataTransfer(testDataRequest)
    expect(mockCheckS3BucketData).toHaveBeenCalledWith(testDataRequest)
    expect(mockUpdateZendeskTicketById).not.toHaveBeenCalled()
    expect(mockAddNewDataRequestRecord).toHaveBeenCalledWith(
      testDataRequest,
      false,
      false
    )
    expect(startGlacierRestore).not.toHaveBeenCalled()
    expect(sendContinuePollingDataTransferMessage).not.toHaveBeenCalled()
    expect(sendInitiateAthenaQueryMessage).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID
    )
  })

  it('initiates a copy when we require a copy and no glacier restore', async () => {
    const filesToCopy = ['myFile1', 'myFile2']
    givenDataResult(true, filesToCopy, [])
    await initiateDataTransfer(testDataRequest)
    expect(mockCheckS3BucketData).toHaveBeenCalledWith(testDataRequest)
    expect(mockUpdateZendeskTicketById).not.toHaveBeenCalled()
    expect(mockAddNewDataRequestRecord).toHaveBeenCalledWith(
      testDataRequest,
      false,
      true
    )
    expect(mockStartCopyJob).toHaveBeenCalledWith(
      filesToCopy,
      ZENDESK_TICKET_ID
    )
    expect(mockStartGlacierRestore).not.toHaveBeenCalled()
    expect(mockSendContinuePollingDataTransferMessage).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID
    )
    expect(sendInitiateAthenaQueryMessage).not.toHaveBeenCalled()
  })

  it('initiates a glacier restore if necessary', async () => {
    const glacierTierLocationsToCopy = ['glacier-file1', 'glacier-file-2']
    givenDataResult(true, [], glacierTierLocationsToCopy)
    await initiateDataTransfer(testDataRequest)
    expect(mockAddNewDataRequestRecord).toHaveBeenCalledWith(
      testDataRequest,
      true,
      false
    )
    expect(startGlacierRestore).toHaveBeenCalledWith(
      glacierTierLocationsToCopy,
      ZENDESK_TICKET_ID
    )

    expect(startCopyJob).not.toHaveBeenCalled()
    expect(sendContinuePollingDataTransferMessage).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID
    )
    expect(sendInitiateAthenaQueryMessage).not.toHaveBeenCalled()
  })

  it('does not start a copy if glacier restore required', async () => {
    const glacierTierLocationsToCopy = ['glacier-file1', 'glacier-file-2']
    givenDataResult(true, ['some-file-to-copy'], glacierTierLocationsToCopy)
    await initiateDataTransfer(testDataRequest)
    expect(mockAddNewDataRequestRecord).toHaveBeenCalledWith(
      testDataRequest,
      true,
      false
    )
    expect(startGlacierRestore).toHaveBeenCalledWith(
      glacierTierLocationsToCopy,
      ZENDESK_TICKET_ID
    )

    expect(startCopyJob).not.toHaveBeenCalled()
    expect(sendContinuePollingDataTransferMessage).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID
    )
    expect(sendInitiateAthenaQueryMessage).not.toHaveBeenCalled()
  })
})
