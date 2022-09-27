import { DataRequestParams } from '../../types/dataRequestParams'
import { getEnv } from '../../utils/helpers'

export const createQuerySql = (requestData: DataRequestParams): string => {
  const identifiers = getIdentifiers(requestData)

  console.log(identifiers)

  const dataSource = `${getEnv('ATHENA_DATABASE_NAME')}.${getEnv(
    'ATHENA_TABLE_NAME'
  )}`

  const queryString = `SELECT * FROM ${dataSource}`

  return queryString
}

const getIdentifiers = (requestData: DataRequestParams): string[] => {
  const identifierType = requestData.identifierType

  if (identifierType === 'event_id' && requestData.eventIds) {
    return requestData.eventIds
  } else if (identifierType === 'journey_id' && requestData.journeyIds) {
    return requestData.journeyIds
  } else if (identifierType === 'session_id' && requestData.sessionIds) {
    return requestData.sessionIds
  } else if (identifierType === 'user_id' && requestData.userIds) {
    return requestData.userIds
  }
  return []
}
