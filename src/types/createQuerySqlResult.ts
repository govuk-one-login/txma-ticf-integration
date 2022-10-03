export interface CreateQuerySqlResult {
  sqlGenerated: boolean
  sql?: string
  idParameters?: string[]
  error?: string
}
