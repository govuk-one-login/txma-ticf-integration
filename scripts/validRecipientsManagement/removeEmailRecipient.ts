import { listCurrentEmailRecipients } from './listCurrentEmailRecipients'
import { writeRecipientListToBucket } from './writeRecipientListToBucket'

export const removeEmailRecipient = async (
  email: string,
  environment: string
) => {
  const currentRecipientList = await listCurrentEmailRecipients(environment)
  if (!currentRecipientList.includes(email)) {
    console.log(`Recipient '${email}' is not in list, so nothing to remove`)
    return
  }
  const newRecipientList = currentRecipientList.filter(
    (recipientEmail) => recipientEmail != email
  )
  console.log(`Writing updated recipient list with '${email}' removed`)
  await writeRecipientListToBucket(newRecipientList, environment)
  console.log(`Finished writing updated recipient list with '${email}' removed`)
}
