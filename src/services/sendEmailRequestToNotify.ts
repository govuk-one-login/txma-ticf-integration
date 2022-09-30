import { NotifyClient } from 'notifications-node-client'
import { retrieveNotifySecrets } from '../secrets/retrieveNotifyApiSecrets'
import { PersonalisationOptions } from '../types/notify/personalisationOptions'

export const sendEmailToNotify = async (
  requestDetails: PersonalisationOptions
) => {
  const secrets = await retrieveNotifySecrets()
  const notifyClient = new NotifyClient(secrets.notifyApiKey)

  console.log('Sending request to Notify')
  const response = await Promise.resolve(
    notifyClient.sendEmail(secrets.notifyTemplateId, requestDetails.email, {
      personalisation: {
        firstName: requestDetails.firstName,
        zendeskId: requestDetails.zendeskId,
        signedUrl: requestDetails.signedUrl
      }
    })
  )

  const responseInfo = {
    status: response.status,
    emailSentTo: requestDetails.email,
    subjectLine: response.data.content.subject
  }
  console.log(responseInfo)
}
