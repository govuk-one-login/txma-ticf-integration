import { getEnv } from '../utils/helpers'

export const ZENDESK_ADMIN_EMAIL = getEnv('ZENDESK_ADMIN_EMAIL')
export const ZENDESK_AGENT_EMAIL = getEnv('ZENDESK_AGENT_EMAIL')
export const ZENDESK_END_USER_EMAIL = getEnv('ZENDESK_END_USER_EMAIL')
export const ZENDESK_END_USER_NAME = 'Txma-team2-ticf-analyst-dev'

export const ZENDESK_BASE_URL = getEnv('ZENDESK_BASE_URL')
export const ZENDESK_REQUESTS_ENDPOINT = '/api/v2/requests'
export const ZENDESK_TICKETS_ENDPOINT = '/api/v2/tickets'

export const ZENDESK_WEBHOOK_API_BASE_URL = getEnv(
  'ZENDESK_WEBHOOK_API_BASE_URL'
)
export const ZENDESK_WEBHOOK_SECRET_KEY = getEnv('ZENDESK_WEBHOOK_SECRET_KEY')
