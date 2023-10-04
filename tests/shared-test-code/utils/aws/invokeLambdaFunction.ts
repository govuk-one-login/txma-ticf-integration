import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda'
import { getEnv } from '../helpers'

export const invokeLambdaFunction = async (
  functionName: string,
  payload: unknown
) => {
  const client = new LambdaClient({ region: getEnv('AWS_REGION') })
  const input = {
    FunctionName: functionName,
    Payload: jsonToUint8Array(payload)
  }
  const result = await client.send(new InvokeCommand(input))
  if (result.FunctionError) {
    throw Error(`Lambda invoke gave error '${result.FunctionError}'`)
  }
  return uint8ArrayToJson(result.Payload)
}

const jsonToUint8Array = (json: unknown) => {
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
