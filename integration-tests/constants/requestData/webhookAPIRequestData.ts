import {
  generateRandomNumber,
  generateZendeskRequestDate
} from '../../utils/helpers'
import { TEST_DATA_DATA_PATHS, TEST_DATA_EVENT_ID } from '../awsParameters'
import {
  ZendeskFormFieldIDs,
  ZENDESK_END_USER_EMAIL,
  ZENDESK_END_USER_NAME,
  ZENDESK_PII_FORM_ID
} from '../zendeskParameters'

export const validApiTestRequestData = {
  request: {
    subject: `Integration Test Request - ` + generateRandomNumber(),
    ticket_form_id: ZENDESK_PII_FORM_ID,
    custom_fields: [
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_FIELD_ID,
        value: 'event_id'
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_EVENT_ID_LIST_FIELD_ID,
        value: TEST_DATA_EVENT_ID
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUEST_DATE_FIELD_ID,
        value: generateZendeskRequestDate(-60)
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUESTED_PII_TYPE_FIELD_ID,
        value: ['drivers_license']
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_CUSTOM_DATA_PATH_FIELD_ID,
        value: TEST_DATA_DATA_PATHS
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_EMAIL,
        value: ZENDESK_END_USER_EMAIL
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_NAME,
        value: ZENDESK_END_USER_NAME
      }
    ],
    comment: {
      body: 'PII request created in integration test'
    }
  }
}
