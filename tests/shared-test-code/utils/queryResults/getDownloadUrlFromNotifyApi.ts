import { NotifyClient } from 'notifications-node-client'
import {
  CustomAxiosResponse,
  NotificationObject
} from '../../types/notify/customAxiosResponse'
import { getEnv, pause } from '../helpers'

// Email objects from Notify here are referred to as Notifications

export const pollNotifyApiForDownloadUrl = async (zendeskId: string) => {
  const maxAttempts = 30
  let attempts = 0
  let url = undefined
  while (!url && attempts < maxAttempts) {
    attempts++
    url = await getDownloadUrlFromNotifyApi(zendeskId)
    await pause(3000)
  }
  return url ?? ''
}

const getDownloadUrlFromNotifyApi = async (
  zendeskId: string
): Promise<string | undefined> => {
  const emailList = await queryNotifyEmailRequests(zendeskId)

  if (!emailList) return undefined

  const mostRecentEmail = await getMostRecentEmailSent(emailList)
  const url = getUrlFromEmailBody(mostRecentEmail?.body ?? '') ?? ''

  if (url) {
    console.log(`Found URL for Zendesk ID: ${zendeskId}`)
  }

  return url
}

const queryNotifyEmailRequests = async (
  zendeskId: string
): Promise<NotificationObject[] | undefined> => {
  const client = new NotifyClient(getEnv('NOTIFY_API_KEY'))
  const response: CustomAxiosResponse = await client.getNotifications(
    '',
    '',
    zendeskId // the email reference -> assigned as the ZendeskId for querying purposes
  )

  if (!response?.data) throw Error('Empty response returned from Notify')

  if (
    !response?.data?.notifications ||
    !response?.data?.notifications?.length
  ) {
    return undefined
  }

  return response.data.notifications
}

const getMostRecentEmailSent = async (emailList: NotificationObject[]) => {
  if (emailList.length > 1) {
    return extractMostRecentEmail(emailList)
  }
  return emailList.pop()
}

const extractMostRecentEmail = (
  listOfEmails: NotificationObject[]
): NotificationObject => {
  return listOfEmails.reduce((prev, curr) =>
    new Date(prev.created_at).getTime() > new Date(curr.created_at).getTime()
      ? prev
      : curr
  )
}

const getUrlFromEmailBody = (emailBody: string) => {
  const urlRegex =
    /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi
  const extractedUrlList = emailBody.match(urlRegex)

  if (!extractedUrlList) throw Error('No URL found in email body')

  return extractedUrlList.pop()
}
