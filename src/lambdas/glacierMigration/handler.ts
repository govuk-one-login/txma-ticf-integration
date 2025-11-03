import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  _Object
} from '@aws-sdk/client-s3'
import {
  S3ControlClient,
  CreateJobCommand,
  S3StorageClass
} from '@aws-sdk/client-s3-control'
import { logger } from '../../../common/sharedServices/logger'
import { getEnv } from '../../../common/utils/helpers'

const s3Client = new S3Client({ region: getEnv('AWS_REGION') })
const s3ControlClient = new S3ControlClient({ region: getEnv('AWS_REGION') })

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

    const standardObjects = objects.filter(
      (obj) => obj.LastModified! > cutoffDate
    )
    const glacierObjects = objects.filter(
      (obj) => obj.LastModified! <= cutoffDate
    )

    const jobIds: string[] = []

    await createS3BatchJob(standardObjects, jobIds, 'STANDARD')

    await createS3BatchJob(glacierObjects, jobIds, 'GLACIER_IR')

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Batch jobs created`,
        jobIds,
        objectCount: objects.length,
        standardCount: standardObjects.length,
        glacierCount: glacierObjects.length
      })
    }
  } catch (error) {
    logger.error('Glacier migration error', error as Error)
    return {
      statusCode: 500,
      body: JSON.stringify(`Error: ${error}`)
    }
  }

  async function createS3BatchJob(
    objects: _Object[],
    jobIds: string[],
    storageClass: S3StorageClass
  ) {
    if (objects.length > 0) {
      const jobId = await createBatchJob(
        objects,
        storageClass,
        manifestBucket,
        originalBucket,
        batchJobRole,
        accountId,
        restoredBucket
      )
      jobIds.push(jobId)
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

    if (response?.Contents?.length) {
      objects.push(...response.Contents)
    }

    continuationToken = response?.NextContinuationToken
  } while (continuationToken)

  return objects
}

async function createBatchJob(
  objects: _Object[],
  storageClass: S3StorageClass,
  manifestBucket: string,
  originalBucket: string,
  batchJobRole: string,
  accountId: string,
  restoredBucket: string
): Promise<string> {
  const manifestKey = `glacier-migration-${storageClass.toLowerCase()}-${Date.now()}.csv`
  const manifest = objects
    .map((obj) => `${restoredBucket},${obj.Key}`)
    .join('\n')

  await s3Client.send(
    new PutObjectCommand({
      Bucket: manifestBucket,
      Key: manifestKey,
      Body: `Bucket,Key\n${manifest}`
    })
  )

  const response = await s3ControlClient.send(
    new CreateJobCommand({
      AccountId: accountId,
      Operation: {
        S3PutObjectCopy: {
          TargetResource: `arn:aws:s3:::${originalBucket}`,
          CannedAccessControlList: 'private',
          MetadataDirective: 'COPY',
          StorageClass: storageClass
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
      ClientRequestToken: `glacier-migration-${storageClass.toLowerCase()}-${Date.now()}`,
      Report: {
        Bucket: manifestBucket,
        Format: 'Report_CSV_20180820',
        Enabled: true,
        Prefix: 'batch-job-reports/',
        ReportScope: 'AllTasks'
      }
    })
  )

  return response.JobId!
}
