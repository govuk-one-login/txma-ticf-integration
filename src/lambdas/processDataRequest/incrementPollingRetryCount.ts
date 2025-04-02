import { incrementObjectFieldByOne } from '../../../common/sharedServices/dynamoDB/dynamoDBUpdate'

export const incrementPollingRetryCount = async (zendeskId: string) => {
  await incrementObjectFieldByOne(zendeskId, 'checkGlacierStatusCount')
}
