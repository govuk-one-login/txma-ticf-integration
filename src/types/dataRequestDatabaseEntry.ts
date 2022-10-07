import { DataRequestParams } from './dataRequestParams'
export interface DataRequestDatabaseEntry {
  requestInfo: DataRequestParams
  checkGlacierStatusCount?: number
  checkCopyStatusCount?: number
}
