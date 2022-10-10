import { S3BucketDataLocationResult } from '../../types/s3BucketDataLocationResult'
import { checkS3BucketData } from '../../sharedServices/s3/checkS3BucketData'
import { initiateDataTransfer } from './initiateDataTransfer'
import { startGlacierRestore } from '../../sharedServices/bulkJobs/startGlacierRestore'
import { testDataRequest } from '../../utils/tests/testDataRequest'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { ZENDESK_TICKET_ID } from '../../utils/tests/testConstants'
import { zendeskCopy } from '../../i18n/zendeskCopy'
import { interpolateTemplate } from '../../utils/interpolateTemplate'

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

describe('initiate data transfer', () => {
  const givenDataResult = (
    dataAvailable: boolean,
    standardTierLocationsToCopy?: string[],
    glacierTierLocationsToCopy?: string[]
  ) => {
    mockCheckS3BucketData.mockResolvedValue({
      standardTierLocationsToCopy: standardTierLocationsToCopy,
      glacierTierLocationsToCopy: glacierTierLocationsToCopy,
      dataAvailable
    })
  }

  const givenNoDataAvailable = () => {
    givenDataResult(false)
  }

  const givenDataAvailable = () => {
    givenDataResult(true)
  }

  beforeEach(() => {
    mockUpdateZendeskTicketById.mockReset()
    mockStartGlacierRestore.mockReset()
  })

  it('calls Zendesk to close ticket if no data can be found for the requested parameters', async () => {
    givenNoDataAvailable()
    await initiateDataTransfer(testDataRequest)
    expect(mockCheckS3BucketData).toHaveBeenCalledWith(testDataRequest)
    expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      interpolateTemplate('bucketDataUnavailable', zendeskCopy),
      'closed'
    )
  })

  it('does not call Zendesk if data can be found for the requested parameters', async () => {
    givenDataAvailable()
    // TODO: when actual logic to kick off bucket copy is written, tests for this should go here
    await initiateDataTransfer(testDataRequest)
    expect(mockCheckS3BucketData).toHaveBeenCalledWith(testDataRequest)
    expect(mockUpdateZendeskTicketById).not.toHaveBeenCalled()
    expect(startGlacierRestore).not.toHaveBeenCalled()
  })

  it('initiates a glacier restore if necessary', async () => {
    const glacierTierLocationsToCopy = ['glacier-file1', 'glacier-file-2']
    givenDataResult(true, [], glacierTierLocationsToCopy)
    await initiateDataTransfer(testDataRequest)
    expect(startGlacierRestore).toHaveBeenCalledWith(
      glacierTierLocationsToCopy,
      ZENDESK_TICKET_ID
    )
  })
})
