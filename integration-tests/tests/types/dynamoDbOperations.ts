import { AttributeValue } from '@aws-sdk/client-dynamodb'

export interface DynamoDbOperation {
  operation: 'GET' | 'PUT' | 'DELETE'
  params: OperationParams
}

export interface OperationParams {
  tableName: string
  zendeskId?: string
  attributeName?: string
  itemToPut?: Record<string, AttributeValue>
}
