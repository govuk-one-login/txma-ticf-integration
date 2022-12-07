import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda'
import { AWS_REGION } from '../../constants/awsParameters'
import { DynamoDbOperation } from '../../../integration-tests/types/dynamoDbOperations'
import { SqsMessage } from '../../../integration-tests/types/sqsMessage'

export const invokeLambdaFunction = async (
  functionName: string,
  payload: DynamoDbOperation | SqsMessage
) => {
  const client = new LambdaClient({ region: AWS_REGION })
  const input = {
    FunctionName: functionName,
    Payload: jsonToUint8Array(payload)
  }
  const result = await client.send(new InvokeCommand(input))
  return uint8ArrayToJson(result.Payload)
}

const jsonToUint8Array = (json: DynamoDbOperation | SqsMessage) => {
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
