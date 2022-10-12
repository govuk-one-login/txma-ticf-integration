import {
  generateRandomNumber,
  generateZendeskRequestDate
} from '../utils/helpers'
import { getEnvVariable } from './zendeskParameters'

const ZENDESK_PII_FORM_ID = 5603412248860
const PII_FORM_IDENTIFIER_FIELD_ID = 5605352623260
const PII_FORM_IDENTIFIER_LIST_FIELD_ID = 5605423021084
const PII_FORM_REQUEST_DATE_FIELD_ID = 5605700069916
const PII_FORM_REQUESTED_PII_TYPE_FIELD_ID = 5641719421852
const PII_FORM_CUSTOM_DATA_PATH_FIELD_ID = 5698447116060
const ZENDESK_SUPPORT_PII_REQUEST_STATUS_FIELD_ID = 5605885870748
const PII_FORM_IDENTIFIER_RECIPIENT_EMAIL = 6202354485660
const PII_FORM_IDENTIFIER_RECEIPIENT_NAME = 6202301182364

export const VALID_RECIPIENT_EMAIL = getEnvVariable('ZENDESK_END_USER_EMAIL')
export const VALID_REQUESTER_EMAIL = getEnvVariable('ZENDESK_END_USER_EMAIL')
export const VALID_RECIPIENT_NAME = 'Txma-team2-ticf-analyst-dev'
export const VALID_REQUESTER_NAME = 'Txma-team2-ticf-analyst-dev'

const validRequestData = {
  request: {
    subject: `Integration Test Request - ` + generateRandomNumber(),
    ticket_form_id: ZENDESK_PII_FORM_ID,
    custom_fields: [
      {
        id: PII_FORM_IDENTIFIER_FIELD_ID,
        value: 'event_id'
      },
      {
        id: PII_FORM_IDENTIFIER_LIST_FIELD_ID,
        value: '637783 3256'
      },
      {
        id: PII_FORM_REQUEST_DATE_FIELD_ID,
        value: generateZendeskRequestDate(-60)
      },
      {
        id: PII_FORM_REQUESTED_PII_TYPE_FIELD_ID,
        value: ['drivers_license']
      },
      {
        id: PII_FORM_CUSTOM_DATA_PATH_FIELD_ID,
        value: ''
      },
      {
        id: PII_FORM_IDENTIFIER_RECIPIENT_EMAIL,
        value: VALID_RECIPIENT_EMAIL
      },
      {
        id: PII_FORM_IDENTIFIER_RECEIPIENT_NAME,
        value: VALID_RECIPIENT_NAME
      }
    ],
    comment: {
      body: 'PII request created in integration test'
    }
  }
}

const invalidRequestData = {
  request: {
    subject: `Integration Test Request - ` + generateRandomNumber(),
    ticket_form_id: ZENDESK_PII_FORM_ID,
    custom_fields: [
      {
        id: PII_FORM_IDENTIFIER_FIELD_ID,
        value: 'event_id'
      },
      {
        id: PII_FORM_IDENTIFIER_LIST_FIELD_ID,
        value: '637783 3256'
      },
      {
        id: PII_FORM_REQUEST_DATE_FIELD_ID,
        value: generateZendeskRequestDate(50)
      },
      {
        id: PII_FORM_REQUESTED_PII_TYPE_FIELD_ID,
        value: ['drivers_license']
      },
      {
        id: PII_FORM_CUSTOM_DATA_PATH_FIELD_ID,
        value: ''
      },
      {
        id: PII_FORM_IDENTIFIER_RECIPIENT_EMAIL,
        value: VALID_RECIPIENT_EMAIL
      },
      {
        id: PII_FORM_IDENTIFIER_RECEIPIENT_NAME,
        value: VALID_REQUESTER_NAME
      }
    ],
    comment: {
      body: 'PII request created in integration test'
    }
  }
}

const ticketApprovalData = {
  ticket: {
    tags: ['process_started', 'approved'],
    custom_fields: [
      { id: ZENDESK_SUPPORT_PII_REQUEST_STATUS_FIELD_ID, value: 'approved' }
    ],
    status: 'open',
    fields: [
      { id: ZENDESK_SUPPORT_PII_REQUEST_STATUS_FIELD_ID, value: 'approved' }
    ],
    collaborator_ids: [],
    follower_ids: [],
    comment: {
      body: '<p>Request <b>APPROVED</b> and data retrieval has started...</p>',
      html_body:
        '<p>Request <b>APPROVED</b> and data retrieval has started...</p>',
      public: 'true'
    }
  }
}

export { validRequestData, ticketApprovalData, invalidRequestData }
