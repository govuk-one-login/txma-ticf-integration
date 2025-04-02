import { VALID_EMAIL_RECIPIENTS_FILE_NAME } from '../../common/constants/configurationConstants'
import { readS3DataToString } from '../../common/sharedServices/s3/readS3DataToString'
import { getValidRecipientBucketName } from './getValidRecipientBucketName'

export const listCurrentEmailRecipients = async (
  environment: string
): Promise<string[]> => {
  const rawList = await readS3DataToString(
    getValidRecipientBucketName(environment),
    VALID_EMAIL_RECIPIENTS_FILE_NAME
  )
  return rawList.split('\n')
}
