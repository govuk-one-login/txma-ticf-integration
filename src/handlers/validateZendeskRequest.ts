import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda'

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('received Zendesk webhook', JSON.stringify(event, null, 2))
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'ok'
    })
  }
}
