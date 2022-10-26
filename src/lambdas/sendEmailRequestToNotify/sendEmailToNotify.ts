import { NotifyClient } from 'notifications-node-client'
import { notifyCopy } from '../../constants/notifyCopy'
import { retrieveNotifySecrets } from '../../sharedServices/secrets/retrieveNotifyApiSecrets'
import { PersonalisationOptions } from '../../types/notify/personalisationOptions'
import { interpolateTemplate } from '../../utils/interpolateTemplate'

export const sendEmailToNotify = async (
  requestDetails: PersonalisationOptions
) => {
  const secrets = await retrieveNotifySecrets()
  const notifyClient = new NotifyClient(secrets.notifyApiKey)

  console.log(interpolateTemplate('requestToNotify', notifyCopy))
  const response = await Promise.resolve(
    notifyClient.sendEmail(secrets.notifyTemplateId, requestDetails.email, {
      personalisation: {
        firstName: requestDetails.firstName,
        zendeskId: requestDetails.zendeskId,
        secureDownloadUrl: requestDetails.secureDownloadUrl
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
