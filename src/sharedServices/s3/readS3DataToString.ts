export const readS3DataToString = (
  bucketName: string,
  fileKey: string
): Promise<string> => {
  console.log(`reading file ${fileKey} from bucket ${bucketName}`)
  return Promise.resolve('')
}
