import {
  PutObjectTaggingCommand,
  PutObjectTaggingCommandOutput,
  Tag
} from '@aws-sdk/client-s3'
import { s3Client } from './s3Client'

export const s3AddObjectTag = (
  bucket: string,
  key: string,
  tags: Tag[]
): Promise<PutObjectTaggingCommandOutput> => {
  return s3Client.send(
    new PutObjectTaggingCommand({
      Bucket: bucket,
      Key: key,
      Tagging: {
        TagSet: tags
      }
    })
  )
}
