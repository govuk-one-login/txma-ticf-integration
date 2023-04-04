import { readS3DataToString } from '../../sharedServices/s3/readS3DataToString'
import { getEnv } from '../../utils/helpers'
export const isEmailInValidRecipientList = async (
  recipientEmail: string
): Promise<boolean> => {
  const validRecipientList = await readS3DataToString(
    getEnv('VALID_EMAIL_RECIPIENTS_BUCKET'),
    'valid-email-recipients.txt'
  )
  return validRecipientList.includes(recipientEmail)
}
