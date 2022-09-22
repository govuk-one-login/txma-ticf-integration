import { APIGatewayProxyEvent } from 'aws-lambda'
import { NotifyClient } from 'notifications-node-client'
import { retrieveNotifySecrets } from '../secrets/retrieveNotifySecrets'
import { AxiosResponse } from '../types/notify/axiosResponse'
import { tryParseJSON } from '../utils/helpers'

// event type is a placeholder
export const handler = async (event: APIGatewayProxyEvent) => {
  if (!event.body) return 'No body'
  const requestDetails = tryParseJSON(event.body)
  const secrets = await retrieveNotifySecrets()
  const notifyClient = new NotifyClient(secrets.notifyApiKey)
  const response = await Promise.resolve(
    notifyClient.sendEmail(secrets.notifyTemplateId, requestDetails.email, {
      personalisation: {
        firstName: requestDetails.firstName,
        zendeskId: requestDetails.zendeskId,
        signedUrl: requestDetails.signedUrl
      }
    })
  )
  const objResponse: AxiosResponse = tryParseJSON(response)
  const configData = tryParseJSON(objResponse.config.data)
  const logObject = {
    status: objResponse.status,
    emailSentTo: configData.email_address,
    subjectLine: objResponse.data.content.subject
  }
  console.log(logObject)
}
