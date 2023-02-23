import {
  CopyObjectCommand,
  CopyObjectCommandOutput,
  StorageClass
} from '@aws-sdk/client-s3'
import { s3Client } from './s3Client'

export const s3ChangeStorageClass = (
  bucket: string,
  key: string,
  storageClass: StorageClass
): Promise<CopyObjectCommandOutput> => {
  return s3Client.send(
    new CopyObjectCommand({
      CopySource: `${bucket}/${key}`,
      Bucket: bucket,
      StorageClass: storageClass,
      Key: key
    })
  )
}
