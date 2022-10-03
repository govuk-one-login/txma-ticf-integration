export interface CreateQuerySqlResult {
  sqlGenerated: boolean
  sql?: string
  identifiers?: string[]
  error?: string
}
