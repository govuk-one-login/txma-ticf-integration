import { S3BucketDataLocationResult } from '../types/s3BucketDataLocationResult'
import { checkS3BucketData } from './locateS3BucketData'
import { initiateDataTransfer } from './initiateDataTransfer'
import { testDataRequest } from '../utils/tests/testDataRequest'

jest.mock('./locateS3BucketData', () => ({
  locateS3BucketData: jest.fn()
}))
const mockLocateS3BucketData = checkS3BucketData as jest.Mock<
  Promise<S3BucketDataLocationResult>
>

describe('initiate data transfer', () => {
  const givenDataResult = (
    dataAvailable: boolean,
    standardTierLocationsToCopy?: string[],
    glacierTierLocationsToCopy?: string[]
  ) => {
    mockLocateS3BucketData.mockResolvedValue({
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

  it('returns false if not data can be found for the requested parameters', async () => {
    givenNoDataAvailable()
    expect(await initiateDataTransfer(testDataRequest)).toEqual({
      success: false,
      errorMessage: 'No data found for request'
    })
    expect(mockLocateS3BucketData).toHaveBeenCalledWith(testDataRequest)
  })

  it('returns true if data can be found for the requested parameters', async () => {
    givenDataAvailable()
    // TODO: when actual logic to kick off bucket copy is written, tests for this should go here
    expect(await initiateDataTransfer(testDataRequest)).toEqual({
      success: true
    })
    expect(mockLocateS3BucketData).toHaveBeenCalledWith(testDataRequest)
  })
})
