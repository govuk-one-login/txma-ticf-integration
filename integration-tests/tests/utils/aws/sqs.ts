import { getEnv } from '../helpers'
import { invokeLambdaFunction } from './invokeLambdaFunction'

export const addMessageToQueue = async (message: string, queueUrl: string) => {
  return invokeLambdaFunction(getEnv('SQS_OPERATIONS_FUNCTION_NAME'), {
    message: message,
    queueUrl: queueUrl
  })
}
