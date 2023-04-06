import { HeadObjectCommand, HeadObjectCommandOutput } from '@aws-sdk/client-s3'
import { s3Client } from '../s3Client'

export const s3HeadObject = (
  bucket: string,
  s3Key: string
): Promise<HeadObjectCommandOutput> => {
  return s3Client.send(
    new HeadObjectCommand({
      Bucket: bucket,
      Key: s3Key
    })
  )
}
