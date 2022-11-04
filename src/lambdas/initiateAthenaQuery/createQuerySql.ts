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
  console.info('Generating Athena SQL query string')
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

  const sqlIdTypeStatement = formatIdTypeStatement(identifierType)

  const sqlSelectStatement = formatSelectStatement(
    filteredDataPaths,
    filteredPiiTypes
  )

  const sqlWhereStatement = formatWhereStatement(
    identifierType,
    identifiers.length
  )

  const dataSource = `${getEnv('ATHENA_DATABASE_NAME')}.${getEnv(
    'ATHENA_TABLE_NAME'
  )}`

  const queryString = `SELECT ${sqlIdTypeStatement} ${sqlSelectStatement} FROM ${dataSource} WHERE ${sqlWhereStatement} AND datetime >= ? AND datetime <= ?`

  const queryParameters = generateQueryParameters(
    identifiers,
    requestData.dateFrom,
    requestData.dateTo
  )

  return {
    sqlGenerated: true,
    sql: queryString,
    queryParameters: queryParameters
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
  switch (identifierType) {
    case 'event_id': {
      return 'event_id,'
    }
    default: {
      const identifierTypeEventPath = identifierTypeEventPathMap(identifierType)
      const idSelectStatement = formatDataPath(identifierTypeEventPath)

      return `event_id, ${idSelectStatement},`
    }
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
  const dataColumn = splitDataPath.shift()
  const dataTarget = splitDataPath.join('.')
  const newResultName = splitDataPath.join('_').replaceAll(/[0-9[\]]/g, '')

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
  dateFrom: string,
  dateTo: string
): string[] => {
  const queryParameters = identifiers.map((identifier) => identifier)
  queryParameters.push(formatDateFrom(dateFrom))
  queryParameters.push(formatDateTo(dateTo))
  return queryParameters
}

const formatDateFrom = (dateFrom: string): string => {
  const splitDateFrom = dateFrom.split('-')
  splitDateFrom.push('00')
  return `'${splitDateFrom.join('/')}'`
}

const formatDateTo = (dateTo: string): string => {
  const splitDateTo = dateTo.split('-')
  splitDateTo.push('23')
  return `'${splitDateTo.join('/')}'`
}
