import { ZendeskUser } from '../types/zendeskUser'
import { base64Encode, makeHttpsRequest } from './httpsRequestUtils'
import { retrieveZendeskApiSecrets } from '../secrets/retrieveZendeskApiSecrets'
import https from 'node:https'

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

  const data = (await makeHttpsRequest(options)) as ZendeskUser
  console.log('Found user:', data)

  return data
}
