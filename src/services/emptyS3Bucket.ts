import {
  DeleteObjectCommand,
  GetBucketVersioningCommand,
  PutBucketVersioningCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { getEnv } from '../utils/helpers'
import { listS3Objects } from './listS3Objects'
import { listS3ObjectVersions } from './listS3ObjectVersions'

export const emptyS3Bucket = async (bucketName: string): Promise<void> => {
  const s3Client = new S3Client({ region: getEnv('AWS_REGION') })

  const getVersioningCommand = new GetBucketVersioningCommand({
    Bucket: bucketName
  })
  const getVersioningResponse = await s3Client.send(getVersioningCommand)

  if (getVersioningResponse.Status == 'Enabled') {
    const suspendVersioningCommand = new PutBucketVersioningCommand({
      Bucket: bucketName,
      VersioningConfiguration: { Status: 'Suspended' }
    })
    await s3Client.send(suspendVersioningCommand)

    const objectVersions = await listS3ObjectVersions({
      Bucket: bucketName
    })
    objectVersions.deleteMarkers.forEach(async (marker) => {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: marker
      })
      await s3Client.send(command)
    })
    objectVersions.versions.forEach(async (version) => {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: version
      })
      await s3Client.send(command)
    })
  }

  const objects = await listS3Objects({ Bucket: bucketName })
  objects.forEach(async (object) => {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: object
    })
    await s3Client.send(command)
  })
}
