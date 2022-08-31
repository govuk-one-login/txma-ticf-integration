import { getEnv } from './helpers'

export const ANALYSIS_BUCKET_NAME = getEnv('ANALYSIS_BUCKET_NAME')
export const AUDIT_BUCKET_NAME = getEnv('AUDIT_BUCKET_NAME')
export const REGION = getEnv('AWS_REGION')
