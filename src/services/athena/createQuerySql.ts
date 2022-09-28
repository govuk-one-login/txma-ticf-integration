import { CreateQuerySqlResult } from '../../types/createQuerySqlResult'
import {
  DataRequestParams,
  IdentifierTypes
} from '../../types/dataRequestParams'
import { getEnv } from '../../utils/helpers'

export const createQuerySql = (
  requestData: DataRequestParams
): CreateQuerySqlResult => {
  const identifierType = requestData.identifierType
  const identifiers = getIdentifiers(identifierType, requestData)

  if (identifiers.length < 1) {
    return {
      sqlGenerated: false,
      error: `No ids of type: ${identifierType}`
    }
  }

  const sqlWhereStatement = formatWhereStatment(identifierType, identifiers)

  const dataSource = `${getEnv('ATHENA_DATABASE_NAME')}.${getEnv(
    'ATHENA_TABLE_NAME'
  )}`

  const queryString = `SELECT restricted FROM ${dataSource} WHERE ${sqlWhereStatement}`

  return {
    sqlGenerated: true,
    sql: queryString
  }
}

const formatWhereStatment = (
  identifierType: IdentifierTypes,
  identifiers: string[]
): string => {
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
  }

  return []
}
