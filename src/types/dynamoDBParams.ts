import { DataRequestParams } from './dataRequestParams'

export interface DynamoDBParams extends DataRequestParams {
  athenaQueryId?: string
}
