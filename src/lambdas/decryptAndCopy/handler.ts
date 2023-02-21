import {
  S3BatchEvent,
  S3BatchResult,
  S3BatchEventTask,
  Context
} from 'aws-lambda'
import { initialiseLogger, logger } from '../../sharedServices/logger'
import { getS3ObjectAsStream } from '../../sharedServices/s3/getS3ObjectAsStream'
import { decryptS3Object } from './decryptS3Object'
import { putS3Object } from '../../sharedServices/s3/putS3Object'
import { getEnv, extractS3BucketNameFromArn } from '../../utils/helpers'

export const handler = async (
  event: S3BatchEvent,
  context: Context
): Promise<S3BatchResult> => {
  initialiseLogger(context)
  logger.info('Handling S3BatchEvent decryption', { handledEvent: event })

  if (event.tasks.length === 0) {
    throw new Error('No tasks in event')
  }

  const key = event.tasks[0].s3Key
  const bucket = extractS3BucketNameFromArn(event.tasks[0].s3BucketArn)

  const encryptedData = await getS3ObjectAsStream(bucket, key)

  const decryptedData = await decryptS3Object(encryptedData)

  await putS3Object(getEnv('ANALYSIS_BUCKET_NAME'), key, decryptedData)

  return {
    invocationSchemaVersion: '1.0',
    treatMissingKeysAs: 'PermanentFailure',
    invocationId: event.invocationId,
    results: event.tasks.map((t: S3BatchEventTask) => ({
      taskId: t.taskId,
      resultCode: 'Succeeded',
      resultString: key
    }))
  }
}
