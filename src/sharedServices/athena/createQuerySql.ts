import { CreateQuerySqlResult } from '../../types/createQuerySqlResult'
import {
  DataRequestParams,
  IdentifierTypes
} from '../../types/dataRequestParams'
import { getEnv } from '../../utils/helpers'

export const createQuerySql = (
  requestData: DataRequestParams
): CreateQuerySqlResult => {
  console.info('Generating Athena SQL query string')
  const identifierType = requestData.identifierType
  const identifiers = getIdentifiers(identifierType, requestData)

  if (identifiers.length < 1) {
    return {
      sqlGenerated: false,
      error: `No ids of type: ${identifierType}`
    }
  }

  if (!requestData.dataPaths || requestData.dataPaths.length < 1) {
    return {
      sqlGenerated: false,
      error: 'No dataPaths in request'
    }
  }

  // The SELECT statement relies upon user inputs - dataPaths, piiTypes - which are validated to
  // minimise SQL injection risk
  const sqlSelectStatement = formatSelectStatement(requestData.dataPaths)

  // formatWhereStatement ensures that the WHERE statement is parameterised to
  // protect against SQL injection
  const sqlWhereStatement = formatWhereStatment(
    identifierType,
    identifiers.length
  )

  const dataSource = `${getEnv('ATHENA_DATABASE_NAME')}.${getEnv(
    'ATHENA_TABLE_NAME'
  )}`

  const queryString = `SELECT ${sqlSelectStatement} FROM ${dataSource} WHERE ${sqlWhereStatement}`

  return {
    sqlGenerated: true,
    sql: queryString,
    idParameters: identifiers
  }
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

const formatSelectStatement = (
  dataPaths: string[] | undefined
): string | undefined => {
  const formattedDataPaths = dataPaths?.map((dataPath) =>
    formatDataPath(dataPath)
  )

  return formattedDataPaths?.join(', ')
}

const formatDataPath = (dataPath: string): string => {
  const splitDataPath = dataPath.split('.')

  const dataColumn = splitDataPath.shift()

  const dataTarget = splitDataPath.join('.')

  const newResultName = splitDataPath.join('_').toLowerCase()

  return `json_extract(${dataColumn}, '$.${dataTarget}') as ${newResultName}`
}

const formatWhereStatment = (
  identifierType: IdentifierTypes,
  numberOfIdentifiers: number
): string => {
  const whereStatementsArray = []

  for (let i = 0; i < numberOfIdentifiers; i++) {
    whereStatementsArray.push(`${identifierType}=?`)
  }

  return whereStatementsArray.join(' OR ')
}
