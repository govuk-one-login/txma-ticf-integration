import { ZendeskRequestData } from '../../shared-test-code/types/zendeskRequestData'
import {
  generateRandomNumber,
  getEnv
} from '../../shared-test-code/utils/helpers'
import {
  ZendeskFormFieldIDs,
  ZENDESK_PII_FORM_ID
} from '../../shared-test-code/constants/zendeskParameters'
import {
  END_TO_END_TEST_DATA_PATH,
  END_TO_END_TEST_DATE,
  END_TO_END_TEST_EVENT_ID,
  END_TO_END_TEST_JOURNEY_ID,
  END_TO_END_TEST_SESSION_ID,
  END_TO_END_TEST_USER_ID
} from './testData'

export const endToEndFlowRequestDataWithEventId: ZendeskRequestData = {
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
        value: END_TO_END_TEST_EVENT_ID
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUEST_DATE_FIELD_ID,
        value: END_TO_END_TEST_DATE
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUESTED_PII_TYPE_FIELD_ID,
        value: null
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_CUSTOM_DATA_PATH_FIELD_ID,
        value: END_TO_END_TEST_DATA_PATH
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_EMAIL,
        value: getEnv('ZENDESK_RECIPIENT_EMAIL')
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_NAME,
        value: getEnv('ZENDESK_RECIPIENT_NAME')
      }
    ],
    comment: {
      body: 'PII request created in integration test'
    }
  }
}

export const endToEndFlowRequestDataWithUserId: ZendeskRequestData = {
  request: {
    subject: `Integration Test Request - ` + generateRandomNumber(),
    ticket_form_id: ZENDESK_PII_FORM_ID,
    custom_fields: [
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_FIELD_ID,
        value: 'user_id'
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_USER_ID_LIST_FIELD_ID,
        value: END_TO_END_TEST_USER_ID
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUEST_DATE_FIELD_ID,
        value: END_TO_END_TEST_DATE
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUESTED_PII_TYPE_FIELD_ID,
        value: ['passport_number', 'passport_expiry_date']
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_CUSTOM_DATA_PATH_FIELD_ID,
        value: ''
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_EMAIL,
        value: getEnv('ZENDESK_RECIPIENT_EMAIL')
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_NAME,
        value: getEnv('ZENDESK_RECIPIENT_NAME')
      }
    ],
    comment: {
      body: 'PII request created in integration test'
    }
  }
}

export const endToEndFlowRequestDataWithSessionId: ZendeskRequestData = {
  request: {
    subject: `Integration Test Request - ` + generateRandomNumber(),
    ticket_form_id: ZENDESK_PII_FORM_ID,
    custom_fields: [
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_FIELD_ID,
        value: 'session_id'
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_SESSION_ID_LIST_FIELD_ID,
        value: END_TO_END_TEST_SESSION_ID
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUEST_DATE_FIELD_ID,
        value: END_TO_END_TEST_DATE
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUESTED_PII_TYPE_FIELD_ID,
        value: ['name', 'dob', 'addresses']
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_CUSTOM_DATA_PATH_FIELD_ID,
        value: ''
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_EMAIL,
        value: getEnv('ZENDESK_RECIPIENT_EMAIL')
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_NAME,
        value: getEnv('ZENDESK_RECIPIENT_NAME')
      }
    ],
    comment: {
      body: 'PII request created in integration test'
    }
  }
}

export const endToEndFlowRequestDataWithJourneyId: ZendeskRequestData = {
  request: {
    subject: `Integration Test Request - ` + generateRandomNumber(),
    ticket_form_id: ZENDESK_PII_FORM_ID,
    custom_fields: [
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_FIELD_ID,
        value: 'journey_id'
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_JOURNEY_ID_LIST_FIELD_ID,
        value: END_TO_END_TEST_JOURNEY_ID
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUEST_DATE_FIELD_ID,
        value: END_TO_END_TEST_DATE
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUESTED_PII_TYPE_FIELD_ID,
        value: ['drivers_license']
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_CUSTOM_DATA_PATH_FIELD_ID,
        value: ''
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_EMAIL,
        value: getEnv('ZENDESK_RECIPIENT_EMAIL')
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_NAME,
        value: getEnv('ZENDESK_RECIPIENT_NAME')
      }
    ],
    comment: {
      body: 'PII request created in integration test'
    }
  }
}

export const endToEndFlowRequestDataNoMatch: ZendeskRequestData = {
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
        value: 'zzzzzzzz-yyyy-aaaa-bbbb-cccccccccccc'
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUEST_DATE_FIELD_ID,
        value: END_TO_END_TEST_DATE
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUESTED_PII_TYPE_FIELD_ID,
        value: null
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_CUSTOM_DATA_PATH_FIELD_ID,
        value: END_TO_END_TEST_DATA_PATH
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_EMAIL,
        value: getEnv('ZENDESK_RECIPIENT_EMAIL')
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_NAME,
        value: getEnv('ZENDESK_RECIPIENT_NAME')
      }
    ],
    comment: {
      body: 'PII request created in integration test'
    }
  }
}
