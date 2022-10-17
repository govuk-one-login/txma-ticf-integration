import { ZendeskRequestData } from '../types/zendeskRequestData'
import {
  generateRandomNumber,
  generateZendeskRequestDate
} from '../utils/helpers'
import {
  PII_FORM_CUSTOM_DATA_PATH_FIELD_ID,
  PII_FORM_IDENTIFIER_FIELD_ID,
  PII_FORM_IDENTIFIER_LIST_FIELD_ID,
  PII_FORM_IDENTIFIER_RECEIPIENT_NAME,
  PII_FORM_IDENTIFIER_RECIPIENT_EMAIL,
  PII_FORM_REQUESTED_PII_TYPE_FIELD_ID,
  PII_FORM_REQUEST_DATE_FIELD_ID,
  ZENDESK_END_USER_EMAIL,
  ZENDESK_END_USER_NAME,
  ZENDESK_PII_FORM_ID,
  PII_FORM_REQUEST_STATUS_FIELD_ID
} from './zendeskParameters'

const generateSubjectLine = () => {
  const fixedSubjectLine = process.env.FIXED_SUBJECT_LINE
  if (fixedSubjectLine) {
    return fixedSubjectLine
  }
  return `Integration Test Request - ` + generateRandomNumber()
}

const generateEventIds = () => {
  const overrideEventIds = process.env.OVERRIDE_EVENT_IDS
  if (overrideEventIds) {
    return overrideEventIds
  }
  return '637783 3256'
}

export const validRequestData: ZendeskRequestData = {
  request: {
    subject: generateSubjectLine(),
    ticket_form_id: ZENDESK_PII_FORM_ID,
    custom_fields: [
      {
        id: PII_FORM_IDENTIFIER_FIELD_ID,
        value: 'event_id'
      },
      {
        id: PII_FORM_IDENTIFIER_LIST_FIELD_ID,
        value: generateEventIds()
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

export const invalidRequestData: ZendeskRequestData = {
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
