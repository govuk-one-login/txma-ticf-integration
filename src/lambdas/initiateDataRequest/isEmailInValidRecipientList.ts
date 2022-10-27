export const isEmailInValidRecipientList = async (
  recipientEmail: string
): Promise<boolean> => {
  console.log(
    `Checking if recipient email ${recipientEmail} is in the pre-defined list of recipients`
  )
  // TODO: add logic here to retrieve list from S3 bucket etc.
  return true
}
