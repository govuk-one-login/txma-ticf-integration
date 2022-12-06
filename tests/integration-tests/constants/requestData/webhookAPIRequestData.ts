import {
  generateRandomNumber,
  generateZendeskRequestDate,
  getEnv
} from '../../../shared-test-code/utils/helpers'
import {
  TEST_DATA_DATA_PATHS,
  TEST_DATA_EVENT_ID
} from '../../../shared-test-code/constants/awsParameters'
import {
  ZendeskFormFieldIDs,
  ZENDESK_PII_FORM_ID,
  ZENDESK_RECIPIENT_NAME
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
        value: getEnv('ZENDESK_RECIPIENT_EMAIL')
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_NAME,
        value: ZENDESK_RECIPIENT_NAME
      }
    ],
    comment: {
      body: 'PII request created in integration test'
    }
  }
}
