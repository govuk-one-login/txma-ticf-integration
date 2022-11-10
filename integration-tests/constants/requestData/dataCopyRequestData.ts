import { ZendeskRequestData } from '../../types/zendeskRequestData'
import {
  generateRandomNumber,
  generateZendeskRequestDate
} from '../../utils/helpers'
import {
  INTEGRATION_TEST_DATE,
  TEST_DATA_DATA_PATHS,
  INTEGRATION_TEST_DATE_GLACIER,
  TEST_DATA_EVENT_ID,
  INTEGRATION_TEST_DATE_MIX_DATA,
  INTEGRATION_TEST_DATE_NO_DATA
} from '../awsParameters'
import {
  ZendeskFormFieldIDs,
  ZENDESK_END_USER_EMAIL,
  ZENDESK_END_USER_NAME,
  ZENDESK_PII_FORM_ID
} from '../zendeskParameters'

const generateSubjectLine = () => {
  const fixedSubjectLine = process.env.FIXED_SUBJECT_LINE
  if (fixedSubjectLine) {
    return fixedSubjectLine
  }
  return `Integration Test Request - ${generateRandomNumber()}`
}

const generateEventIds = () => {
  const overrideEventIds = process.env.OVERRIDE_EVENT_IDS
  if (overrideEventIds) {
    return overrideEventIds
  }
  return TEST_DATA_EVENT_ID
}

export const validRequestData: ZendeskRequestData = {
  request: {
    subject: generateSubjectLine(),
    ticket_form_id: ZENDESK_PII_FORM_ID,
    custom_fields: [
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_FIELD_ID,
        value: 'event_id'
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_EVENT_ID_LIST_FIELD_ID,
        value: generateEventIds()
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUEST_DATE_FIELD_ID,
        value: INTEGRATION_TEST_DATE
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUESTED_PII_TYPE_FIELD_ID,
        value: ['drivers_license']
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_CUSTOM_DATA_PATH_FIELD_ID,
        value: process.env.DATA_PATHS
          ? process.env.DATA_PATHS
          : TEST_DATA_DATA_PATHS
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_EMAIL,
        value: process.env.FIXED_RECIPIENT_EMAIL
          ? process.env.FIXED_RECIPIENT_EMAIL
          : ZENDESK_END_USER_EMAIL
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

export const setCustomFieldValueForRequest = (
  requestData: ZendeskRequestData,
  fieldId: number,
  fieldValue: string
) => {
  const customField = requestData.request.custom_fields.find(
    (f) => f.id === fieldId
  )
  if (customField) {
    customField.value = fieldValue
  }
}

export const invalidRequestData: ZendeskRequestData = {
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
        value: '637783 3256'
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUEST_DATE_FIELD_ID,
        value: generateZendeskRequestDate(50)
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

export const validGlacierRequestData: ZendeskRequestData = {
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
        value: INTEGRATION_TEST_DATE_GLACIER
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

export const validStandardAndGlacierTiersRequestData: ZendeskRequestData = {
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
        value: INTEGRATION_TEST_DATE_MIX_DATA
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

export const validRequestNoData: ZendeskRequestData = {
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
        value: INTEGRATION_TEST_DATE_NO_DATA
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
