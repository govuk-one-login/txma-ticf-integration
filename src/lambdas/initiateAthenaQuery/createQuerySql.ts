import {
  IDENTIFIER_TYPES_EVENT_PATH_MAP,
  PII_TYPES_DATA_PATHS_MAP
} from '../../constants/athenaSqlMapConstants'
import { CreateQuerySqlResult } from '../../types/athena/createQuerySqlResult'
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

  if (!identifiers.length) {
    return {
      sqlGenerated: false,
      error: `No ids of type: ${identifierType}`
    }
  }

  const filteredDataPaths = filterPathArray(requestData.dataPaths)
  const filteredPiiTypes = filterPathArray(requestData.piiTypes)

  if (!filteredDataPaths.length && !filteredPiiTypes.length) {
    return {
      sqlGenerated: false,
      error: 'No dataPaths or piiTypes in request'
    }
  }

  const dataSource = `${getEnv('ATHENA_DATABASE_NAME')}.${getEnv(
    'ATHENA_TABLE_NAME'
  )}`

  const commaSeparatedQuestionMarks = (numberOfEntries: number) =>
    Array(numberOfEntries).fill('?').join(',')
  const queryString = `SELECT datetime, ${formatIdTypeStatement(
    identifierType
  )} ${formatSelectStatement(
    filteredDataPaths,
    filteredPiiTypes
  )} FROM ${dataSource} WHERE ${formatWhereStatement(
    identifierType,
    identifiers.length
  )} AND datetime IN (${commaSeparatedQuestionMarks(requestData.dates.length)})`

  return {
    sqlGenerated: true,
    sql: queryString,
    queryParameters: generateQueryParameters(identifiers, requestData.dates)
  }
}

const getIdentifiers = (
  identifierType: IdentifierTypes,
  requestData: DataRequestParams
): string[] => {
  if (identifierType === 'event_id' && requestData.eventIds.length) {
    return requestData.eventIds
  } else if (identifierType === 'journey_id' && requestData.journeyIds.length) {
    return requestData.journeyIds
  } else if (identifierType === 'session_id' && requestData.sessionIds.length) {
    return requestData.sessionIds
  } else if (identifierType === 'user_id' && requestData.userIds.length) {
    return requestData.userIds
  }

  return []
}

const filterPathArray = (pathArray: string[]): string[] => {
  return pathArray.map((x) => x.replaceAll(' ', '')).filter((x) => x.length)
}

const formatIdTypeStatement = (identifierType: IdentifierTypes): string => {
  if (identifierType === 'event_id') {
    return 'event_id,'
  } else {
    const identifierTypeEventPath = identifierTypeEventPathMap(identifierType)
    const idSelectStatement = formatDataPath(identifierTypeEventPath)

    return `event_id, ${idSelectStatement},`
  }
}

const formatSelectStatement = (
  dataPaths: string[],
  piiTypes: string[]
): string => {
  const formattedDataPaths = dataPaths.length
    ? dataPaths.map((dataPath) => formatDataPath(dataPath))
    : []
  const formattedPiiTypes = piiTypes.length
    ? piiTypes.map((piiType) => formatPiiType(piiType))
    : []

  return formattedDataPaths.concat(formattedPiiTypes).join(', ')
}

const formatDataPath = (dataPath: string): string => {
  const splitDataPath = dataPath.toLowerCase().split('.')

  if (splitDataPath.length == 1) {
    return dataPath.toLowerCase()
  }

  const dataColumn = splitDataPath.shift()
  const dataTarget = splitDataPath.join('.')
  const newResultName = splitDataPath.join('_').replaceAll(/[[\]]/g, '')

  return `json_extract(${dataColumn}, '$.${dataTarget}') as ${newResultName}`
}

const formatPiiType = (piiType: string): string => {
  const piiTypePath = piiTypeDataPathMap(piiType).toLowerCase()
  const splitPiiTypePath = piiTypePath.split('.')
  const dataColumn = splitPiiTypePath.shift()
  const dataTarget = splitPiiTypePath.join('.')

  return `json_extract(${dataColumn}, '$.${dataTarget}') as ${piiType}`
}

const piiTypeDataPathMap = (piiType: string): string => {
  return PII_TYPES_DATA_PATHS_MAP[piiType]
}

const identifierTypeEventPathMap = (identfierType: IdentifierTypes): string => {
  return IDENTIFIER_TYPES_EVENT_PATH_MAP[identfierType]
}

const formatWhereStatement = (
  identifierType: IdentifierTypes,
  numberOfIdentifiers: number
): string => {
  const idWhereStatement = formatIdWhereStatement(identifierType)

  if (numberOfIdentifiers == 1) {
    return `${idWhereStatement}=?`
  }

  const whereStatementsArray = []

  for (let i = 0; i < numberOfIdentifiers; i++) {
    whereStatementsArray.push('?')
  }

  return `${idWhereStatement} IN (${whereStatementsArray.join(', ')})`
}

const formatIdWhereStatement = (identifierType: IdentifierTypes) => {
  if (identifierType === 'event_id') {
    return 'event_id'
  }
  const identifierTypeEventPath = identifierTypeEventPathMap(identifierType)
  const splitDataPath = identifierTypeEventPath.toLowerCase().split('.')
  const dataColumn = splitDataPath.shift()
  const dataTarget = splitDataPath.join('.')

  return `json_extract_scalar(${dataColumn}, '$.${dataTarget}')`
}

const generateQueryParameters = (
  identifiers: string[],
  dates: string[]
): string[] => {
  const queryParameters = identifiers.map((identifier) => `'${identifier}'`)
  dates.forEach((date) => queryParameters.push(`'${formatDateForQuery(date)}'`))
  return queryParameters
}

const formatDateForQuery = (dateFrom: string): string => {
  return dateFrom.replaceAll('-', '/')
}
