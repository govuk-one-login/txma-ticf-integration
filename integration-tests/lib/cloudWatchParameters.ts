import { getEnvVariable } from './zendeskParameters'
export const initiateDataRequestLambdalogGroupName =
  '/aws/lambda/ticf-integration-initiate-data-request'

const apiGatewayEndpoint = '/default/zendesk-webhook'
export const apiGatewayUrl = `https://${getEnvVariable(
  'AWS_BASE_URL'
)}${apiGatewayEndpoint}`
