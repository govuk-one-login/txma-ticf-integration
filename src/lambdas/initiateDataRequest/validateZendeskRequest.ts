import { ValidatedDataRequestParamsResult } from '../../types/validatedDataRequestParamsResult'
import {
  getEpochDate,
  tryParseJSON,
  isEmpty,
  mapSpaceSeparatedStringToList
} from '../../utils/helpers'

const IDENTIFIERS = ['event_id', 'session_id', 'journey_id', 'user_id']

const VALID_PII_TYPES = [
  'passport_number',
  'passport_expiry_date',
  'drivers_license',
  'name',
  'dob',
  'current_address',
  'previous_address'
]

export const validateZendeskRequest = (
  body: string | null
): ValidatedDataRequestParamsResult => {
  const data = tryParseJSON(body ?? '{}')
  if (isEmpty(data)) {
    return {
      validationMessage: 'No data in request',
      isValid: false
    }
  }
  const isEmailValid = (email: string) =>
    /^\w+([.-]?\w+)*@\w+([.-]?\w+)*\.gov.uk$/.test(email ?? '')

  const piiTypes = data.piiTypes.replace(/,/g, '')
  const piiTypesValidated = !piiTypes.length || /[^,(?! )]+/gm.test(piiTypes)
  const piiTypesList = mapSpaceSeparatedStringToList(data.piiTypes)
  const piiTypesAllValid = piiTypesList?.length
    ? piiTypesList.every((type) => VALID_PII_TYPES.includes(type))
    : true
  const fieldValidation = [
    {
      message: 'Recipient email format invalid',
      isValid: isEmailValid(data.recipientEmail)
    },
    {
      message: 'Requester email format invalid',
      isValid: isEmailValid(data.requesterEmail)
    },
    {
      message: 'At least one session id should be provided',
      isValid:
        data.identifierType != 'session_id' || data.sessionIds?.length > 0
    },
    {
      message: 'At least one journey id should be provided',
      isValid:
        data.identifierType != 'journey_id' || data.journeyIds?.length > 0
    },
    {
      message: 'At least one event id should be provided',
      isValid: data.identifierType != 'event_id' || data.eventIds?.length > 0
    },
    {
      message: 'At least one user id should be provided',
      isValid: data.identifierType != 'user_id' || data.userIds?.length > 0
    },
    {
      message: 'Recipient name is missing',
      isValid: data.recipientName?.length > 0
    },
    {
      message: 'Requester name is missing',
      isValid: data.requesterName?.length > 0
    },
    {
      message: 'From date is invalid',
      isValid: dateFormatCorrect(data.dateFrom)
    },
    {
      message: 'To date is invalid',
      isValid: dateFormatCorrect(data.dateTo)
    },
    {
      message: 'From Date is in the future',
      isValid:
        !dateFormatCorrect(data.dateFrom) ||
        dateIsOnOrBeforeToday(data.dateFrom)
    },
    {
      message: 'To Date is in the future',
      isValid:
        !dateFormatCorrect(data.dateTo) || dateIsOnOrBeforeToday(data.dateTo)
    },
    {
      message: 'To Date is before From Date',
      isValid:
        !dateFormatCorrect(data.dateFrom) ||
        !dateFormatCorrect(data.dateTo) ||
        datesAreInCorrectOrder(data.dateFrom, data.dateTo)
    },
    {
      message: 'Identifier type is invalid',
      isValid: IDENTIFIERS.includes(data.identifierType)
    },
    {
      message: 'Invalid data in PiiTypes',
      isValid: piiTypesValidated
    },
    {
      message: 'invalid PII type specified',
      isValid: piiTypesAllValid
    },
    {
      message: 'PII types and/or Data Paths must be set',
      isValid: data.piiTypes?.length > 0 || data.dataPaths?.length > 0
    }
  ]

  let isValid = true
  const validationMessages: string[] = []
  fieldValidation.forEach((v) => {
    if (!v.isValid) {
      validationMessages.push(v.message)
    }
    isValid = isValid && v.isValid
  })
  return {
    validationMessage: validationMessages.length
      ? validationMessages.join(', ')
      : undefined,
    dataRequestParams: {
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
      zendeskId: data.zendeskId,
      sessionIds: mapSpaceSeparatedStringToList(data.sessionIds),
      journeyIds: mapSpaceSeparatedStringToList(data.journeyIds),
      eventIds: mapSpaceSeparatedStringToList(data.eventIds),
      userIds: mapSpaceSeparatedStringToList(data.userIds),
      piiTypes: mapSpaceSeparatedStringToList(data.piiTypes),
      dataPaths: mapSpaceSeparatedStringToList(data.dataPaths),
      identifierType: data.identifierType,
      recipientEmail: data.recipientEmail,
      recipientName: data.recipientName,
      requesterEmail: data.requesterEmail,
      requesterName: data.requesterName
    },
    isValid
  }
}

const dateFormatCorrect = (dateString: string) => {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString)
}

const datesAreInCorrectOrder = (dateFrom: string, dateTo: string) => {
  return new Date(dateFrom) <= new Date(dateTo)
}

const dateIsOnOrBeforeToday = (dateString: string) => {
  return getEpochDate(dateString) <= getTodayUtc()
}

const getTodayUtc = (): number => {
  const today = new Date()
  return Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
}
