import {
  DataRequestParams,
  IdentifierTypes
} from '../../types/dataRequestParams'
import { getEnv } from '../../utils/helpers'

export const createQuerySql = (requestData: DataRequestParams): string => {
  const sqlWhereStatement = formatWhereStatment(requestData)

  const dataSource = `${getEnv('ATHENA_DATABASE_NAME')}.${getEnv(
    'ATHENA_TABLE_NAME'
  )}`

  const queryString = `SELECT restricted FROM ${dataSource} WHERE ${sqlWhereStatement}`

  return queryString
}

const formatWhereStatment = (requestData: DataRequestParams): string => {
  const identifierType = requestData.identifierType

  const identifiers = getIdentifiers(identifierType, requestData)

  const whereStatementsArray = identifiers.map(
    (identifier) => `${identifierType}='${identifier}'`
  )

  return whereStatementsArray.join(' OR ')
}

const getIdentifiers = (
  identifierType: IdentifierTypes,
  requestData: DataRequestParams
): string[] => {
  if (identifierType === 'event_id' && requestData.eventIds) {
    return requestData.eventIds
  } else if (identifierType === 'journey_id' && requestData.journeyIds) {
    return requestData.journeyIds
  } else if (identifierType === 'session_id' && requestData.sessionIds) {
    return requestData.sessionIds
  } else if (identifierType === 'user_id' && requestData.userIds) {
    return requestData.userIds
  } else {
    throw new Error(`No ids of type: ${identifierType}`)
  }
}
