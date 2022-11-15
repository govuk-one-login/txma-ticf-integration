import { NotifyClient } from 'notifications-node-client'
import { retrieveNotifySecrets } from '../../../src/sharedServices/secrets/retrieveNotifyApiSecrets'
import { NotificationObject } from '../../../src/types/notify/customAxiosResponse'

export const getDownloadUrlFromNotifyEmail = async (zendeskId: string) => {
  const secrets = await retrieveNotifySecrets()
  const client = new NotifyClient(secrets.notifyApiKey)
  const emailObject = await getMostRecentEmailSent(client, zendeskId)
  return getUrlFromEmailBody(emailObject?.body ?? '')
}

const getMostRecentEmailSent = async (
  client: NotifyClient,
  zendeskId: string
) => {
  const response = await client.getNotifications('', '', zendeskId)
  const listOfEmails: NotificationObject[] = response.data.notifications
  console.log(listOfEmails)
  if (!listOfEmails.length) {
    throw Error(`No emails found with zendesk ticket reference: ${zendeskId}`)
  }
  if (listOfEmails.length > 1) {
    return getMostRecentEmail(listOfEmails)
  }
  return listOfEmails.pop()
}

const getMostRecentEmail = (listOfEmails: NotificationObject[]) => {
  return listOfEmails.reduce((prev, curr) =>
    new Date(prev.created_at).getTime() < new Date(curr.created_at).getTime()
      ? prev
      : curr
  )
}

const getUrlFromEmailBody = (emailBody: string) => {
  const urlRegex =
    /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi
  const url = emailBody.match(urlRegex)
  if (!url) throw Error('No URL found in email body')

  return url
}
