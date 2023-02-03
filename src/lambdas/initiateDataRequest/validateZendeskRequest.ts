import { isEmailInValidRecipientList } from './isEmailInValidRecipientList'
import { ValidatedDataRequestParamsResult } from '../../types/validatedDataRequestParamsResult'
import {
  getEpochDate,
  tryParseJSON,
  isEmpty,
  mapSpaceSeparatedStringToList,
  removeZendeskPiiTypePrefixFromPiiType
} from '../../utils/helpers'
import { PII_TYPES_DATA_PATHS_MAP } from '../../constants/athenaSqlMapConstants'
import { IdentifierTypes } from '../../types/dataRequestParams'
import { appendZendeskIdToLogger } from '../../sharedServices/logger'

const IDENTIFIERS = ['event_id', 'session_id', 'journey_id', 'user_id']

const validPiiTypes = Object.keys(PII_TYPES_DATA_PATHS_MAP)

export const validateZendeskRequest = async (
  body: string | null
): Promise<ValidatedDataRequestParamsResult> => {
  const data = tryParseJSON(body ?? '{}')
  if (isEmpty(data)) {
    return {
      validationMessage: 'No data in request',
      isValid: false
    }
  }
  if (data.zendeskId) {
    appendZendeskIdToLogger(data.zendeskId)
  }
  const isEmailValid = (email: string) =>
    /^\w+([.-]?\w+)*@\w+([.-]?\w+)*\.gov.uk$/.test(email ?? '')

  const piiTypes = data.piiTypes.replace(/,/g, '')
  const piiTypesValidated = !piiTypes.length || /[^,(?! )]+/gm.test(piiTypes)

  const sanitisedPiiTypesList = mapSpaceSeparatedStringToList(
    data.piiTypes
  ).map(removeZendeskPiiTypePrefixFromPiiType)

  const piiTypesAllValid = sanitisedPiiTypesList?.length
    ? sanitisedPiiTypesList.every((type) => validPiiTypes.includes(type))
    : true

  const dataPathsList = mapSpaceSeparatedStringToList(data.dataPaths)
  const dataPathsAllValid = dataPathsList.length
    ? dataPathsList.every((dataPath) => dataPathFormatCorrect(dataPath))
    : true

  const sanitisedIdentifierType: IdentifierTypes = sanitiseIdentifierType(
    data.identifierType
  )
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
      message: 'Recipient email not in valid recipient list',
      isValid:
        !isEmailValid(data.recipientEmail) ||
        (await isEmailInValidRecipientList(data.recipientEmail))
    },
    {
      message: 'At least one session id should be provided',
      isValid:
        sanitisedIdentifierType != 'session_id' || data.sessionIds?.length > 0
    },
    {
      message: 'At least one journey id should be provided',
      isValid:
        sanitisedIdentifierType != 'journey_id' || data.journeyIds?.length > 0
    },
    {
      message: 'At least one event id should be provided',
      isValid:
        sanitisedIdentifierType != 'event_id' || data.eventIds?.length > 0
    },
    {
      message: 'At least one user id should be provided',
      isValid: sanitisedIdentifierType != 'user_id' || data.userIds?.length > 0
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
      isValid: IDENTIFIERS.includes(sanitisedIdentifierType)
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
    },
    {
      message: 'Invalid Data Path',
      isValid: dataPathsAllValid
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
      piiTypes: sanitisedPiiTypesList,
      dataPaths: mapSpaceSeparatedStringToList(data.dataPaths),
      identifierType: sanitisedIdentifierType,
      recipientEmail: data.recipientEmail,
      recipientName: data.recipientName,
      requesterEmail: data.requesterEmail,
      requesterName: data.requesterName
    },
    isValid
  }
}

const sanitiseIdentifierType = (rawIdentifierType: string): IdentifierTypes => {
  return (rawIdentifierType ?? '').replace(
    'pii_identifier_',
    ''
  ) as IdentifierTypes
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

const dataPathFormatCorrect = (dataPath: string): boolean => {
  return (
    /(\w+(\[\d+\])*\.)+\w+(\[\d+\])*[^,]/.test(dataPath) ||
    (/(\w+(\[\d+\])*)[^,.]/.test(dataPath) && !dataPath.includes('.'))
  )
}
