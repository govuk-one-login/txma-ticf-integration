import { getEnv } from '../utils/helpers'

export const ZENDESK_ADMIN_EMAIL = getEnv('ZENDESK_ADMIN_EMAIL')
export const ZENDESK_AGENT_EMAIL = getEnv('ZENDESK_AGENT_EMAIL')
export const ZENDESK_END_USER_EMAIL = getEnv('ZENDESK_END_USER_EMAIL')
export const ZENDESK_END_USER_NAME = 'Txma-team2-ticf-analyst-dev'

export const ZENDESK_BASE_URL = getEnv('ZENDESK_BASE_URL')
export const ZENDESK_REQUESTS_ENDPOINT = '/api/v2/requests'
export const ZENDESK_TICKETS_ENDPOINT = '/api/v2/tickets'

export const ZENDESK_PII_FORM_ID = 5603412248860

export const ZendeskFormFieldIDs = {
  PII_FORM_IDENTIFIER_FIELD_ID: 5605352623260,
  PII_FORM_EVENT_ID_LIST_FIELD_ID: 5605423021084,
  PII_FORM_REQUEST_DATE_FIELD_ID: 5605700069916,
  PII_FORM_REQUESTED_PII_TYPE_FIELD_ID: 5641719421852,
  PII_FORM_CUSTOM_DATA_PATH_FIELD_ID: 5698447116060,
  PII_FORM_IDENTIFIER_RECIPIENT_EMAIL: 6202354485660,
  PII_FORM_IDENTIFIER_RECIPIENT_NAME: 6202301182364,
  PII_FORM_JOURNEY_ID_LIST_FIELD_ID: 5605588962460,
  PII_FORM_SESSION_ID_LIST_FIELD_ID: 5605573488156,
  PII_FORM_USER_ID_LIST_FIELD_ID: 5605546094108,
  PII_FORM_REQUEST_STATUS_FIELD_ID: 5605885870748
}

export const END_TO_END_TEST_USER_ID =
  'urn:uuid:03d3c6d3-6d7c-41df-bf45-c94401c96a2e'
export const END_TO_END_TEST_SESSION_ID = '25bc52a5-3506-4d7a-8129-adc13a3152bf'
export const END_TO_END_TEST_JOURNEY_ID = '71b8300f-8f06-40e7-a53e-a194beacd33f'
export const END_TO_END_TEST_EVENT_ID = 'b122aa00-129b-46a9-b5f7-6b1bf07d427b'
