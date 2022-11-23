import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'
import { AWS_REGION } from '../../constants/awsParameters'
import { DynamoDbOperation } from '../../types/dynamoDbOperations'

export const invokeDynamoOperationsLambda = async (
  payload: DynamoDbOperation
) => {
  const lambdaClient = new LambdaClient({ region: AWS_REGION })
  const lambdaInvokeCommand = {
    FunctionName: 'tt2-176--add-dynamo-dynamo-operations',
    Payload: jsonToUint8Array(payload)
  }
  const result = await lambdaClient.send(new InvokeCommand(lambdaInvokeCommand))
  result.Payload = uint8ArrayToJson(result.Payload)
  return result
}

const jsonToUint8Array = (json: DynamoDbOperation) => {
  const str = JSON.stringify(json, null, 0)
  const ret = new Uint8Array(str.length)

  for (let i = 0; i < str.length; i++) {
    ret[i] = str.charCodeAt(i)
  }

  return ret
}

const uint8ArrayToJson = (binArray: Uint8Array | undefined) => {
  if (!binArray) return {}

  let str = ''

  for (let i = 0; i < binArray.length; i++) {
    str += String.fromCharCode(binArray[i])
  }

  return JSON.parse(str)
}
