export interface CreateQuerySqlResult {
  sqlGenerated: boolean
  sql?: string
  queryParameters?: string[]
  error?: string
}
