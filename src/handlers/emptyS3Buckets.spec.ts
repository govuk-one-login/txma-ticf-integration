import { CloudFormationCustomResourceDeleteEvent } from 'aws-lambda'
import { emptyS3Bucket } from '../services/emptyS3Bucket'
import { listS3Buckets } from '../services/listS3Buckets'
import { defaultCustomResourceDeleteEvent } from '../utils/tests/events/defaultCustomResourceDeleteEvent'
import { handler } from './emptyS3Buckets'

jest.mock('../services/listS3Buckets', () => ({
  listS3Buckets: jest.fn()
}))
const mockListS3Buckets = listS3Buckets as jest.Mock<Promise<string[]>>

jest.mock('../services/emptyS3Bucket', () => ({
  emptyS3Bucket: jest.fn()
}))
const mockEmptyS3Bucket = emptyS3Bucket as jest.Mock<Promise<void>>

describe('empty s3 buckets handler', () => {
  const givenNoS3Buckets = () => {
    mockListS3Buckets.mockResolvedValue([])
  }

  const givenS3Buckets = () => {
    mockListS3Buckets.mockResolvedValue(['example-bucket'])
  }

  test('event type is not delete', async () => {
    const updateEvent = {
      ...defaultCustomResourceDeleteEvent,
      RequestType: 'Update'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any as CloudFormationCustomResourceDeleteEvent

    expect(await handler(updateEvent)).toEqual({
      PhysicalResourceId: defaultCustomResourceDeleteEvent.PhysicalResourceId,
      StackId: defaultCustomResourceDeleteEvent.StackId,
      RequestId: defaultCustomResourceDeleteEvent.RequestId,
      LogicalResourceId: defaultCustomResourceDeleteEvent.LogicalResourceId,
      Status: 'SUCCESS'
    })
  })
  test('stack contains no s3 buckets', async () => {
    givenNoS3Buckets()
    expect(
      await handler(
        defaultCustomResourceDeleteEvent as CloudFormationCustomResourceDeleteEvent
      )
    ).toEqual({
      PhysicalResourceId: defaultCustomResourceDeleteEvent.PhysicalResourceId,
      StackId: defaultCustomResourceDeleteEvent.StackId,
      RequestId: defaultCustomResourceDeleteEvent.RequestId,
      LogicalResourceId: defaultCustomResourceDeleteEvent.LogicalResourceId,
      Status: 'SUCCESS'
    })
  })

  test('stack contains s3 buckets', async () => {
    givenS3Buckets()
    mockEmptyS3Bucket.mockImplementationOnce(() => Promise.resolve())
    expect(
      await handler(
        defaultCustomResourceDeleteEvent as CloudFormationCustomResourceDeleteEvent
      )
    ).toEqual({
      PhysicalResourceId: defaultCustomResourceDeleteEvent.PhysicalResourceId,
      StackId: defaultCustomResourceDeleteEvent.StackId,
      RequestId: defaultCustomResourceDeleteEvent.RequestId,
      LogicalResourceId: defaultCustomResourceDeleteEvent.LogicalResourceId,
      Status: 'SUCCESS'
    })
    expect(emptyS3Bucket).toHaveBeenCalledWith('example-bucket')
  })

  test('error emptying buckets', async () => {
    givenS3Buckets()
    mockEmptyS3Bucket.mockImplementationOnce(() => {
      throw new Error('error message')
    })
    expect(
      await handler(
        defaultCustomResourceDeleteEvent as CloudFormationCustomResourceDeleteEvent
      )
    ).toEqual({
      PhysicalResourceId: defaultCustomResourceDeleteEvent.PhysicalResourceId,
      StackId: defaultCustomResourceDeleteEvent.StackId,
      RequestId: defaultCustomResourceDeleteEvent.RequestId,
      LogicalResourceId: defaultCustomResourceDeleteEvent.LogicalResourceId,
      Status: 'FAILED',
      Reason: 'error message'
    })
  })
})
