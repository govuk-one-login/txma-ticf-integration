import { GetItemCommand } from '@aws-sdk/client-dynamodb'
import { ddbClient } from './dynamoDBClient'

export const getQueryByZendeskId = async (zendeskId: string) => {
  const params = {
    TableName: 'your-table-name',
    Key: { zendeskId: { S: zendeskId } }
  }

  try {
    const data = await ddbClient.send(new GetItemCommand(params))
    console.log(data)
    return data
  } catch (err) {
    console.error(err)
  }
}
