import { APIGatewayProxyResult } from 'aws-lambda'

export const handler = async (): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'hello world'
    })
  }
}
