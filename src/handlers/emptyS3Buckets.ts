import { CloudFormationCustomResourceEvent } from 'aws-lambda'
import { emptyS3Bucket } from '../services/emptyS3Bucket'
import { listS3Buckets } from '../services/listS3Buckets'
import url from 'node:url'
import { makeHttpsRequest } from '../services/httpsRequestUtils'

export const handler = async (
  event: CloudFormationCustomResourceEvent
): Promise<void> => {
  try {
    if (event.RequestType !== 'Delete') return

    console.log('step 1')
    const stackId = event.StackId
    const s3Buckets = await listS3Buckets(stackId)
    if (s3Buckets.length === 0) return await sendResponse(event, 'SUCCESS')

    console.log('step 2')
    await Promise.all(
      s3Buckets.map((bucket) => {
        emptyS3Bucket(bucket)
      })
    )

    return await sendResponse(event, 'SUCCESS')
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log('step 3')
      return await sendResponse(event, 'FAILED', error.message)
    } else {
      console.log('step 4')
      return await sendResponse(event, 'FAILED', 'Unknown error')
    }
  }
}

const sendResponse = async (
  event: CloudFormationCustomResourceEvent,
  status: 'SUCCESS' | 'FAILED',
  reason?: string
) => {
  const parsedUrl = url.parse(event.ResponseURL)
  console.log('Response URL: ', parsedUrl)

  const data = {
    LogicalResourceId: event.LogicalResourceId,
    Reason: reason,
    RequestId: event.RequestId,
    Status: status,
    StackId: event.StackId,
    PhysicalResourceId:
      'PhysicalResourceId' in event ? event.PhysicalResourceId : ''
  }

  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: 'PUT',
    headers: {
      'content-type': '',
      'content-length': JSON.stringify(data).length
    }
  }
  console.log(data)
  await makeHttpsRequest(options, data)
}
