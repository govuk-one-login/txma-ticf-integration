import https from 'node:https'
import { retrieveZendeskApiSecrets } from '../secrets/retrieveZendeskApiSecrets'
import { isZendeskUserResult, ZendeskUser } from '../../types/zendeskUserResult'
import { base64Encode, makeHttpsRequest } from '../http/httpsRequestUtils'
import { loggingCopy } from '../../constants/loggingCopy'
import { interpolateTemplate } from '../../utils/interpolateTemplate'
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
    throw Error(interpolateTemplate('zendeskUserNotFound', loggingCopy))
  }

  const userInfo = data.user
  logger.info(
    interpolateTemplate('zendeskUserFound', loggingCopy),
    JSON.stringify(userInfo)
  )

  return userInfo
}
