import { readS3DataToString } from '../../sharedServices/s3/readS3DataToString'
import { getEnv } from '../../utils/helpers'
export const isEmailInValidRecipientList = async (
  recipientEmail: string
): Promise<boolean> => {
  console.log(
    `Checking if recipient email ${recipientEmail} is in the pre-defined list of recipients`
  )

  const validRecipientList = await readS3DataToString(
    getEnv('VALID_EMAIL_RECIPIENTS_BUCKET'),
    'valid-email-recipients.txt'
  )
  return validRecipientList.includes(recipientEmail)
}
