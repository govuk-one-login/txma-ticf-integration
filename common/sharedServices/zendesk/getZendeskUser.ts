import https from 'node:https'
import { retrieveZendeskApiSecrets } from '../secrets/retrieveZendeskApiSecrets'
import { isZendeskUserResult, ZendeskUser } from '../../types/zendeskUserResult'
import {
  base64Encode,
  makeHttpsRequest
} from '../../../common/sharedServices/http/httpsRequestUtils'
import { logger } from '../logger'

export const getZendeskUser = async (userId: number): Promise<ZendeskUser> => {
  const secrets = await retrieveZendeskApiSecrets()
  const options: https.RequestOptions = {
    method: 'GET',
    hostname: secrets.zendeskHostName,
    path: `/api/v2/users/${userId}.json`,
    headers: {
      Authorization: base64Encode(
        `${secrets.zendeskApiUserEmail}/token:${secrets.zendeskApiKey}`
      )
    }
  }

  const data = await makeHttpsRequest(options)

  if (!isZendeskUserResult(data)) {
    throw Error('The returned data was not a Zendesk user')
  }
  logger.info('Retrieved Zendesk user info successfully')
  return data.user
}
