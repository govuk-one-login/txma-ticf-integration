import { Logger } from '@aws-lambda-powertools/logger'

const loggerInstance = new Logger({
  serviceName: process.env.AWS_LAMBDA_FUNCTION_NAME,
  logLevel: process.env.LOG_LEVEL || 'DEBUG',
  environment: process.env.ENVIRONMENT
})

export const logger = loggerInstance
