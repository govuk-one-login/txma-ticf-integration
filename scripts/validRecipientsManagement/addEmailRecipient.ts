import { listCurrentEmailRecipients } from './listCurrentEmailRecipients'
import { writeRecipientListToBucket } from './writeRecipientListToBucket'

export const addEmailRecipient = async (email: string, environment: string) => {
  const currentRecipientList = await listCurrentEmailRecipients(environment)
  if (currentRecipientList.includes(email)) {
    console.log(`Email ${email} is already in recipient list, nothing to add`)
    return
  }

  const newRecipientList = [...currentRecipientList, email]
  await writeRecipientListToBucket(newRecipientList, environment)
  console.log(`Added email ${email} to recipient list`)
}
