import { testData } from '../../../e2e-tests/constants/testData'
import { zendeskConstants } from '../../constants/zendeskParameters'
import { CustomField, ZendeskRequestData } from '../../types/zendeskRequestData'
import { generateRandomNumber, getEnv } from '../helpers'

export const generateZendeskTicketData = (
  customFieldValues: Partial<CustomFieldValues>
): ZendeskRequestData => {
  const defaultValues: CustomFieldValues = {
    identifier: 'event_id',
    eventIds: testData.eventId,
    requestDate: testData.date,
    piiTypes: ['name', 'dob', 'addresses'],
    recipientEmail: process.env.FIXED_RECIPIENT_EMAIL
      ? process.env.FIXED_RECIPIENT_EMAIL
      : getEnv('ZENDESK_RECIPIENT_EMAIL'),
    recipientName: getEnv('ZENDESK_RECIPIENT_NAME')
  }

  const mergedValues: CustomFieldValues = {
    ...defaultValues,
    ...customFieldValues
  }

  const customFieldIds = {
    customDataPath: zendeskConstants.fieldIds.customDataPath,
    eventIds: zendeskConstants.fieldIds.eventIds,
    identifier: zendeskConstants.fieldIds.identifier,
    journeyIds: zendeskConstants.fieldIds.journeyIds,
    piiTypes: zendeskConstants.fieldIds.piiTypes,
    recipientEmail: zendeskConstants.fieldIds.recipientEmail,
    recipientName: zendeskConstants.fieldIds.recipientName,
    requestDate: zendeskConstants.fieldIds.requestDate,
    sessionIds: zendeskConstants.fieldIds.sessionIds,
    status: zendeskConstants.fieldIds.status,
    userIds: zendeskConstants.fieldIds.userIds
  }

  return {
    request: {
      subject: process.env.FIXED_SUBJECT_LINE
        ? process.env.FIXED_SUBJECT_LINE
        : `Integration Test Request - ` + generateRandomNumber(),
      ticket_form_id: zendeskConstants.piiFormId,
      custom_fields: setCustomFields(customFieldIds, mergedValues),
      comment: {
        body: 'PII request created in integration test'
      }
    }
  }
}

const setCustomFields = (
  customFieldIds: CustomFieldIds,
  customFieldValues: CustomFieldValues
): CustomField[] => {
  const customFields = Object.keys(customFieldValues).map((key) => {
    if (!(key in customFieldIds)) throw new Error('Invalid custom field name')

    return {
      id: customFieldIds[key as keyof CustomFieldIds],
      value: customFieldValues[key as keyof CustomFieldValues]
    }
  })

  return customFields.filter(
    (element) => element.value !== undefined
  ) as CustomField[]
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

type CustomFieldIds = {
  customDataPath: number
  eventIds: number
  identifier: number
  journeyIds: number
  piiTypes: number
  recipientEmail: number
  recipientName: number
  requestDate: number
  sessionIds: number
  status: number
  userIds: number
}

type CustomFieldValues = {
  customDataPath?: string | null
  eventIds?: string | null
  identifier?: string | null
  journeyIds?: string | null
  piiTypes?: string[] | null
  recipientEmail: string | null
  recipientName: string | null
  requestDate: string | null
  sessionIds?: string | null
  status?: string | null
  userIds?: string | null
}
