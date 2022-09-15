import {
  ListObjectVersionsCommand,
  ListObjectVersionsCommandInput,
  S3Client
} from '@aws-sdk/client-s3'
import { getEnv } from '../utils/helpers'

export const listS3ObjectVersions = async (
  input: ListObjectVersionsCommandInput,
  objectVersions: S3ObjectVersions = { deleteMarkers: [], versions: [] }
) => {
  const client = new S3Client({ region: getEnv('AWS_REGION') })
  const command = new ListObjectVersionsCommand(input)
  const response = await client.send(command)

  if (!response.DeleteMarkers && !response.Versions)
    return { deleteMarkers: [], versions: [] }

  if (response.DeleteMarkers) {
    response.DeleteMarkers.map((item) => item.Key).forEach((item) =>
      objectVersions.deleteMarkers.push(item as string)
    )
  }

  if (response.Versions) {
    response.Versions.map((item) => item.Key).forEach((item) =>
      objectVersions.versions.push(item as string)
    )
  }

  if (
    response.IsTruncated &&
    (response.NextKeyMarker || response.NextVersionIdMarker)
  ) {
    input.VersionIdMarker = response.NextVersionIdMarker || undefined
    input.KeyMarker = response.NextKeyMarker || undefined
    await listS3ObjectVersions(input, objectVersions)
  }

  return objectVersions
}

type S3ObjectVersions = {
  deleteMarkers: string[]
  versions: string[]
}
