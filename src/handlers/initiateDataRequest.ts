import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda'
import { initiateS3DataCheck } from '../services/initateS3DataCheck'
import { updateZendeskTicket } from '../services/updateZendeskTicket'
import { validateZendeskRequest } from '../services/validateZendeskRequest'

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('received Zendesk webhook', JSON.stringify(event, null, 2))
  const validatedZendeskRequest = validateZendeskRequest(event.body)
  // first step
  if (!validatedZendeskRequest.isValid) {
    // inform Zendesk
    await updateZendeskTicket(event.body, 'invalid params')
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Request parameters invalid'
      })
    }
  }
  initiateS3DataCheck(validatedZendeskRequest.dataRequestParams)
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'ok'
    })
  }
}
