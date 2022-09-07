import { CloudFormationCustomResourceEvent } from 'aws-lambda'
import { emptyS3Bucket } from '../services/emptyS3Bucket'
import { listS3Buckets } from '../services/listS3Buckets'
import https from 'node:https'
import url from 'node:url'

export const handler = async (
  event: CloudFormationCustomResourceEvent
): Promise<void> => {
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
  event: CloudFormationCustomResourceEvent,
  status: 'SUCCESS' | 'FAILED',
  reason?: string
) => {
  const parsedUrl = url.parse(event.ResponseURL)

  const data = JSON.stringify({
    LogicalResourceId: event.LogicalResourceId,
    Reason: reason,
    RequestId: event.RequestId,
    ResponseURL: event.ResponseURL,
    Status: status,
    StackId: event.StackId,
    PhysicalResourceId:
      'PhysicalResourceId' in event ? event.PhysicalResourceId : undefined
  })

  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: 'PUT',
    headers: {
      'content-type': '',
      'content-length': data.length
    }
  }

  const request = https.request(options, (response) => {
    console.log(`STATUS: ${response.statusCode}`)
  })
  request.write(data)
  request.end()
}
