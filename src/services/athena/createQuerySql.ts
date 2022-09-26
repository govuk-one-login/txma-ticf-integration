import { GetItemCommandOutput } from '@aws-sdk/client-dynamodb'

export const createQuerySql = (requestData: GetItemCommandOutput): string => {
  console.log(requestData)

  return 'SQL string'
}
