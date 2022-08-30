import {
  S3Client,
  ListObjectsV2Command,
  ListObjectsV2CommandInput
} from '@aws-sdk/client-s3'

export const listS3Objects = async (
  input: ListObjectsV2CommandInput,
  objects: string[] = []
): Promise<string[]> => {
  const client = new S3Client({ region: 'eu-west-2' })
  const command = new ListObjectsV2Command(input)
  const response = await client.send(command)

  if (response.Contents) {
    response.Contents.map((item) => item.Key).forEach((item) =>
      objects.push(item as string)
    )

    if (response.NextContinuationToken) {
      input.ContinuationToken = response.NextContinuationToken
      await listS3Objects(input, objects)
    }
  }
  return objects
}
