import { getEnv } from '../utils/helpers'

export const AWS_REGION = 'eu-west-2'
export const INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP = getEnv(
  'INITIATE_DATA_REQUEST_LAMBA_LOG_GROUP_NAME'
)
export const PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP = getEnv(
  'PROCESS_DATA_REQUEST_LAMBA_LOG_GROUP_NAME'
)
