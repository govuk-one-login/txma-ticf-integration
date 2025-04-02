import { VALID_EMAIL_RECIPIENTS_FILE_NAME } from '../../../common/constants/configurationConstants'
import { readS3DataToString } from '../../../common/sharedServices/s3/readS3DataToString'
import { getEnv } from '../../../common/utils/helpers'
export const isEmailInValidRecipientList = async (
  recipientEmail: string
): Promise<boolean> => {
  const validRecipientList = await readS3DataToString(
    getEnv('VALID_EMAIL_RECIPIENTS_BUCKET'),
    VALID_EMAIL_RECIPIENTS_FILE_NAME
  )
  return validRecipientList.includes(recipientEmail)
}
