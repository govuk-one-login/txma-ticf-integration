import { APIGatewayProxyEvent } from 'aws-lambda'
import { NotifyClient } from 'notifications-node-client'
import { retrieveNotifySecrets } from '../secrets/retrieveNotifySecrets'
import { CustomAxiosResponse } from '../types/notify/axiosResponse'
import { tryParseJSON } from '../utils/helpers'

// event type is a placeholder
export const handler = async (event: APIGatewayProxyEvent) => {
  if (!event.body) return 'No body'
  const requestDetails = tryParseJSON(event.body)
  const secrets = await retrieveNotifySecrets()
  const notifyClient = new NotifyClient(secrets.notifyApiKey)

  console.log('Sending request to Notify')
  // const response = (await Promise.resolve(
  //   notifyClient.sendEmail(secrets.notifyTemplateId, requestDetails.email, {
  //     personalisation: {
  //       firstName: requestDetails.firstName,
  //       zendeskId: requestDetails.zendeskId,
  //       signedUrl: requestDetails.signedUrl
  //     }
  //   })
  // )) as unknown as CustomAxiosResponse

  const response = (await new Promise((resolve, reject) => {
    try {
      resolve(
        notifyClient.sendEmail(secrets.notifyTemplateId, requestDetails.email, {
          personalisation: {
            firstName: requestDetails.firstName,
            zendeskId: requestDetails.zendeskId,
            signedUrl: requestDetails.signedUrl
          }
        })
      )
    } catch (error) {
      console.error('There was an error sending a request to Notify: ', error)
      reject(error)
      return
    }
  })) as unknown as CustomAxiosResponse

  const logObject = {
    status: response.status,
    emailSentTo: requestDetails.email,
    subjectLine: response.data.content.subject
  }
  console.log(logObject)
}
