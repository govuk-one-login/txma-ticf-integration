import { VALID_EMAIL_RECIPIENTS_FILE_NAME } from '../../src/constants/configurationConstants'
import { putS3Object } from '../../src/sharedServices/s3/putS3Object'
import { getValidRecipientBucketName } from './getValidRecipientBucketName'

export const writeRecipientListToBucket = async (
  recipientList: string[],
  environment: string
) => {
  await putS3Object(
    getValidRecipientBucketName(environment),
    VALID_EMAIL_RECIPIENTS_FILE_NAME,
    Buffer.from(convertListToLinebreakDelimitedString(recipientList))
  )
}

const convertListToLinebreakDelimitedString = (recipientList: string[]) =>
  recipientList.reduce((a, b) => `${a}\n${b}`)
