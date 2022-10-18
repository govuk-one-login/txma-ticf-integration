import { ZendeskRequestData } from '../types/zendeskRequestData'
import {
  generateRandomNumber,
  generateZendeskRequestDate
} from '../utils/helpers'
import { INTEGRATION_TEST_DATE, TEST_DATA_EVENT_ID } from './awsParameters'
import {
  PII_FORM_CUSTOM_DATA_PATH_FIELD_ID,
  PII_FORM_IDENTIFIER_FIELD_ID,
  PII_FORM_IDENTIFIER_EVENT_ID_FIELD_ID,
  PII_FORM_IDENTIFIER_RECEIPIENT_NAME,
  PII_FORM_IDENTIFIER_RECIPIENT_EMAIL,
  PII_FORM_REQUESTED_PII_TYPE_FIELD_ID,
  PII_FORM_REQUEST_DATE_FIELD_ID,
  ZENDESK_END_USER_EMAIL,
  ZENDESK_END_USER_NAME,
  ZENDESK_PII_FORM_ID,
  PII_FORM_REQUEST_STATUS_FIELD_ID
} from './zendeskParameters'

export const validRequestData: ZendeskRequestData = {
  request: {
    subject: `Integration Test Request - ` + generateRandomNumber() + ' TT2-15',
    ticket_form_id: ZENDESK_PII_FORM_ID,
    custom_fields: [
      {
        id: PII_FORM_IDENTIFIER_FIELD_ID,
        value: 'event_id'
      },
      {
        id: PII_FORM_IDENTIFIER_EVENT_ID_FIELD_ID,
        value: TEST_DATA_EVENT_ID
      },
      {
        id: PII_FORM_REQUEST_DATE_FIELD_ID,
        value: INTEGRATION_TEST_DATE
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
        value: ZENDESK_END_USER_EMAIL
      },
      {
        id: PII_FORM_IDENTIFIER_RECEIPIENT_NAME,
        value: ZENDESK_END_USER_NAME
      }
    ],
    comment: {
      body: 'PII request created in integration test'
    }
  }
}

export const invalidRequestData: ZendeskRequestData = {
  request: {
    subject: `Integration Test Request - ` + generateRandomNumber() + ' TT2-15',
    ticket_form_id: ZENDESK_PII_FORM_ID,
    custom_fields: [
      {
        id: PII_FORM_IDENTIFIER_FIELD_ID,
        value: 'event_id'
      },
      {
        id: PII_FORM_IDENTIFIER_EVENT_ID_FIELD_ID,
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
        value: ZENDESK_END_USER_EMAIL
      },
      {
        id: PII_FORM_IDENTIFIER_RECEIPIENT_NAME,
        value: ZENDESK_END_USER_NAME
      }
    ],
    comment: {
      body: 'PII request created in integration test'
    }
  }
}

export const validApiTestRequestData = {
  request: {
    subject: `Integration Test Request - ` + generateRandomNumber() + ' TT2-15',
    ticket_form_id: ZENDESK_PII_FORM_ID,
    custom_fields: [
      {
        id: PII_FORM_IDENTIFIER_FIELD_ID,
        value: 'event_id'
      },
      {
        id: PII_FORM_IDENTIFIER_EVENT_ID_FIELD_ID,
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
        value: ZENDESK_END_USER_EMAIL
      },
      {
        id: PII_FORM_IDENTIFIER_RECEIPIENT_NAME,
        value: ZENDESK_END_USER_NAME
      }
    ],
    comment: {
      body: 'PII request created in integration test'
    }
  }
}

export const ticketApprovalData = {
  ticket: {
    tags: ['process_started', 'approved'],
    custom_fields: [
      { id: PII_FORM_REQUEST_STATUS_FIELD_ID, value: 'approved' }
    ],
    status: 'open',
    fields: [{ id: PII_FORM_REQUEST_STATUS_FIELD_ID, value: 'approved' }],
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
