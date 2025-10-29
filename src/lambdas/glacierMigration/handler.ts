import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  _Object
} from '@aws-sdk/client-s3'
import { S3ControlClient, CreateJobCommand } from '@aws-sdk/client-s3-control'
import { logger } from '../../../common/sharedServices/logger'

const s3Client = new S3Client({ region: 'eu-west-2' })
const s3ControlClient = new S3ControlClient({ region: 'eu-west-2' })

export const handler = async () => {
  const originalBucket = process.env.ORIGINAL_BUCKET!
  const restoredBucket = process.env.RESTORED_BUCKET!
  const manifestBucket = process.env.MANIFEST_BUCKET!
  const batchJobRole = process.env.BATCH_JOB_ROLE!
  const accountId = process.env.AWS_ACCOUNT_ID!
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 90)

  try {
    const objects = await getAllObjects(restoredBucket)

    if (!objects.length) {
      return { statusCode: 200, body: 'No objects to migrate' }
    }

    const manifestKey = `glacier-migration-manifest-${Date.now()}.csv`
    const manifest = objects
      .map((obj) => {
        return `${restoredBucket},${obj.Key}`
      })
      .join('\n')

    await s3Client.send(
      new PutObjectCommand({
        Bucket: manifestBucket,
        Key: manifestKey,
        Body: `Bucket,Key\n${manifest}`
      })
    )

    const jobId = await s3ControlClient.send(
      new CreateJobCommand({
        AccountId: accountId,
        Operation: {
          S3PutObjectCopy: {
            TargetResource: `arn:aws:s3:::${originalBucket}`,
            CannedAccessControlList: 'private',
            MetadataDirective: 'COPY'
          }
        },
        Manifest: {
          Spec: {
            Format: 'S3BatchOperations_CSV_20180820',
            Fields: ['Bucket', 'Key']
          },
          Location: {
            ObjectArn: `arn:aws:s3:::${manifestBucket}/${manifestKey}`,
            ETag: '"*"'
          }
        },
        Priority: 10,
        RoleArn: batchJobRole,
        ClientRequestToken: `glacier-migration-${Date.now()}`,
        Report: {
          Bucket: manifestBucket,
          Format: 'Report_CSV_20180820',
          Enabled: true,
          Prefix: 'batch-job-reports/',
          ReportScope: 'AllTasks'
        }
      })
    )

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Batch job created`,
        jobId: jobId.JobId,
        objectCount: objects.length
      })
    }
  } catch (error) {
    logger.error('Glacier migration error', error as Error)
    return {
      statusCode: 500,
      body: JSON.stringify(`Error: ${error}`)
    }
  }
}

async function getAllObjects(bucket: string) {
  const objects: _Object[] = []
  let continuationToken: string | undefined

  do {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken
      })
    )

    if (response && response.Contents && response.Contents.length > 0) {
      objects.push(...response.Contents)
    }

    continuationToken = response?.NextContinuationToken
  } while (continuationToken)

  return objects
}
