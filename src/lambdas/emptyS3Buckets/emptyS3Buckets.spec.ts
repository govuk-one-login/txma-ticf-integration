import { CloudFormationCustomResourceUpdateEvent } from 'aws-lambda'
import { emptyS3Bucket } from './emptyS3Bucket'
import { listS3Buckets } from './listS3Buckets'
import { defaultCustomResourceDeleteEvent } from '../../utils/tests/events/defaultCustomResourceDeleteEvent'
import { handler } from './handler'
import * as httpsRequestUtils from '../../sharedServices/http/httpsRequestUtils'

jest.mock('./listS3Buckets', () => ({
  listS3Buckets: jest.fn()
}))

jest.mock('./emptyS3Bucket', () => ({
  emptyS3Bucket: jest.fn()
}))

const mockListS3Buckets = listS3Buckets as jest.Mock<Promise<string[]>>
const mockEmptyS3Bucket = emptyS3Bucket as jest.Mock<Promise<void>>
let httpsRequestSpy: jest.SpyInstance

const successPayload = {
  PhysicalResourceId: defaultCustomResourceDeleteEvent.PhysicalResourceId,
  StackId: defaultCustomResourceDeleteEvent.StackId,
  RequestId: defaultCustomResourceDeleteEvent.RequestId,
  LogicalResourceId: defaultCustomResourceDeleteEvent.LogicalResourceId,
  Status: 'SUCCESS'
}

describe('empty s3 buckets handler', () => {
  const givenNoS3Buckets = () => {
    mockListS3Buckets.mockResolvedValue([])
  }

  const givenS3Buckets = () => {
    mockListS3Buckets.mockResolvedValue(['example-bucket'])
  }

  beforeEach(() => {
    httpsRequestSpy = jest
      .spyOn(httpsRequestUtils, 'makeHttpsRequest')
      .mockResolvedValue({})
  })

  afterEach(() => {
    httpsRequestSpy.mockClear()
  })

  test('does nothing if event type is not delete', async () => {
    const updateEvent = {
      ...defaultCustomResourceDeleteEvent,
      RequestType: 'Update'
    } as CloudFormationCustomResourceUpdateEvent

    await handler(updateEvent)

    expect(httpsRequestSpy).toBeCalledWith(expect.anything(), successPayload)
  })

  test('does nothing if stack contains no s3 buckets', async () => {
    givenNoS3Buckets()

    await handler(defaultCustomResourceDeleteEvent)

    expect(httpsRequestSpy).toBeCalledWith(expect.anything(), successPayload)
  })

  test('calls empty bucket if stack contains s3 buckets', async () => {
    givenS3Buckets()
    mockEmptyS3Bucket.mockImplementationOnce(() => Promise.resolve())

    await handler(defaultCustomResourceDeleteEvent)

    expect(httpsRequestSpy).toBeCalledWith(expect.anything(), successPayload)
    expect(emptyS3Bucket).toHaveBeenCalledWith('example-bucket')
  })

  test('sends error payload when error emptying buckets', async () => {
    givenS3Buckets()
    mockEmptyS3Bucket.mockImplementationOnce(() => {
      throw new Error('error message')
    })

    await handler(defaultCustomResourceDeleteEvent)

    const errorPayload = {
      ...successPayload,
      Status: 'FAILED',
      Reason: 'error message'
    }

    expect(httpsRequestSpy).toBeCalledWith(expect.anything(), errorPayload)
  })
})
