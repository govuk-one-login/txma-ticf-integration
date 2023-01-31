import { Logger } from '@aws-lambda-powertools/logger'
import { Context } from 'aws-lambda'

const loggerInstance = new Logger({
  serviceName: process.env.AWS_LAMBDA_FUNCTION_NAME,
  logLevel: process.env.LOG_LEVEL || 'DEBUG',
  environment: process.env.ENVIRONMENT
})

export const initialiseLogger = (context: Context) => {
  loggerInstance.addContext(context)
  loggerInstance.removeKeys(['zendeskId'])
}

export const appendZendeskIdToLogger = (zendeskId: string) => {
  loggerInstance.appendKeys({ zendeskId })
}

export const logger = loggerInstance
