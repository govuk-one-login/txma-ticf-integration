import { s3DownloadFileToString } from './s3DownloadFileToString'
import { s3WaitForFile } from './s3WaitForFile'
export const s3WaitForFileContents = async (
  bucketName: string,
  s3Key: string
): Promise<string> => {
  await s3WaitForFile(bucketName, s3Key)
  return s3DownloadFileToString(bucketName, s3Key)
}
