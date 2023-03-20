import {
  S3BatchEvent,
  S3BatchResult,
  S3BatchEventTask,
  Context,
  S3BatchResultResultCode
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

  let resultCode: S3BatchResultResultCode = 'Succeeded'
  let resultString = ''
  if (event.tasks.length === 0) {
    throw new Error('No tasks in event')
  }

  try {
    await decryptAndCopy(event.tasks[0])
    logger.info('Decrypt and copy completed successfully', {
      s3Key: event.tasks[0].s3Key
    })
  } catch (err) {
    logger.error('Error during decrypt and copy', {
      err,
      s3Key: event.tasks[0].s3Key
    })
    resultCode = 'TemporaryFailure'
    resultString = `Err: ${JSON.stringify(err)}`
  }
  return {
    invocationSchemaVersion: '1.0',
    treatMissingKeysAs: 'PermanentFailure',
    invocationId: event.invocationId,
    results: event.tasks.map((t: S3BatchEventTask) => ({
      taskId: t.taskId,
      resultCode: resultCode,
      resultString: resultString
    }))
  }
}

const decryptAndCopy = async (task: S3BatchEventTask) => {
  const key = task.s3Key
  const bucket = extractS3BucketNameFromArn(task.s3BucketArn)

  const encryptedData = await getS3ObjectAsStream(bucket, key)
  logger.info('Successfully retrived S3 object', { key })

  const decryptedData = await decryptS3Object(encryptedData)
  logger.info('Successfully decrypted S3 object', { key })

  await putS3Object(getEnv('ANALYSIS_BUCKET_NAME'), key, decryptedData)
  logger.info('S3 object successfully written to analysis bucket', { key })
}
