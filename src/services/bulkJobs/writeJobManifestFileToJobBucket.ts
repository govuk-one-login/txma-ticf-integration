import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getEnv } from '../../utils/helpers'

export const writeJobManifestFileToJobBucket = async (
  sourceBucket: string,
  fileList: string[],
  manifestFileName: string
): Promise<string> => {
  const client = new S3Client(getEnv('AWS_REGION'))
  console.log(`Writing job manifest file to ${manifestFileName}`)
  const response = await client.send(
    new PutObjectCommand({
      Key: manifestFileName,
      Bucket: getEnv('BATCH_JOB_MANIFEST_BUCKET_NAME'),
      Body: createManifestFile(sourceBucket, fileList)
    })
  )
  console.log('wrote manifest to S3 with etag ', response.ETag)
  return response.ETag as string
}

const createManifestFile = (sourceBucket: string, fileList: string[]) =>
  fileList
    .map((file) => createManifestFileLine(sourceBucket, file))
    .join('\r\n')

const createManifestFileLine = (sourceBucket: string, fileKey: string) =>
  `${sourceBucket},${fileKey}`
