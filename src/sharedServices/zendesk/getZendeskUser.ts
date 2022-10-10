import https from 'node:https'
import { retrieveZendeskApiSecrets } from '../secrets/retrieveZendeskApiSecrets'
import { ZendeskUser } from '../../types/zendeskUser'
import { base64Encode, makeHttpsRequest } from '../http/httpsRequestUtils'
import { interpolateTemplate } from '../../utils/interpolateTemplate'
import { loggingCopy } from '../../i18n/loggingCopy'

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
  console.log(interpolateTemplate('foundUser', loggingCopy), data)

  return data
}
