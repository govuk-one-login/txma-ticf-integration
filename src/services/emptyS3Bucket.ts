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
  if (await versioningStatusEnabled(bucketName)) {
    await deleteObjectVersions(bucketName)
  }
  const objects = await listS3Objects({ Bucket: bucketName })
  await Promise.all(
    objects.map((object) => deleteObject(bucketName, object.Key as string))
  )
}

const s3Client = new S3Client({ region: getEnv('AWS_REGION') })

const deleteObjectVersions = async (bucketName: string) => {
  await disableVersioning(bucketName)
  const objectVersions = await listS3ObjectVersions({ Bucket: bucketName })
  await Promise.all(
    objectVersions.deleteMarkers.map((marker) =>
      deleteObject(bucketName, marker)
    )
  )
  await Promise.all(
    objectVersions.versions.map((version) => deleteObject(bucketName, version))
  )
}

const versioningStatusEnabled = async (
  bucketName: string
): Promise<boolean> => {
  const getVersioningCommand = new GetBucketVersioningCommand({
    Bucket: bucketName
  })
  const getVersioningResponse = await s3Client.send(getVersioningCommand)
  return getVersioningResponse.Status == 'Enabled'
}

const disableVersioning = async (bucketName: string) => {
  const suspendVersioningCommand = new PutBucketVersioningCommand({
    Bucket: bucketName,
    VersioningConfiguration: { Status: 'Suspended' }
  })
  await s3Client.send(suspendVersioningCommand)
}

const deleteObject = (bucketName: string, key: string) => {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key
  })
  return s3Client.send(command)
}
