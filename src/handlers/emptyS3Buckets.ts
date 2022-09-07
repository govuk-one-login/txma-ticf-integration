import {
  CloudFormationCustomResourceDeleteEvent,
  CloudFormationCustomResourceResponse
} from 'aws-lambda'
import { emptyS3Bucket } from '../services/emptyS3Bucket'
import { listS3Buckets } from '../services/listS3Buckets'

export const handler = async (
  event: CloudFormationCustomResourceDeleteEvent
): Promise<CloudFormationCustomResourceResponse> => {
  try {
    if (event.RequestType !== 'Delete') return sendResponse(event, 'SUCCESS')

    const stackId = event.StackId
    const s3Buckets = await listS3Buckets(stackId)
    if (s3Buckets.length === 0) return sendResponse(event, 'SUCCESS')

    await Promise.all(
      s3Buckets.map(async (bucket) => {
        await emptyS3Bucket(bucket)
      })
    )

    return sendResponse(event, 'SUCCESS')
  } catch (error: unknown) {
    if (error instanceof Error) {
      return sendResponse(event, 'FAILED', error.message)
    } else {
      return sendResponse(event, 'FAILED', 'Unknown error')
    }
  }
}

const sendResponse = (
  event: CloudFormationCustomResourceDeleteEvent,
  status: 'SUCCESS' | 'FAILED',
  reason?: string
): CloudFormationCustomResourceResponse => {
  return {
    PhysicalResourceId: event.PhysicalResourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Status: status,
    Reason: reason
  } as CloudFormationCustomResourceResponse
}
