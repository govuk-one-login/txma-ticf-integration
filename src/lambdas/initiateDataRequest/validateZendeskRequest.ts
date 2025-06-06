import { isEmailInValidRecipientList } from './isEmailInValidRecipientList'
import { ValidatedDataRequestParamsResult } from '../../../common/types/validatedDataRequestParamsResult'
import {
  getEpochDate,
  tryParseJSON,
  isEmpty,
  mapSpaceSeparatedStringToList,
  removeZendeskPiiTypePrefixFromPiiType
} from '../../../common/utils/helpers'
import { PII_TYPES_DATA_PATHS_MAP } from '../../../common/constants/athenaSqlMapConstants'
import { IdentifierTypes } from '../../../common/types/dataRequestParams'
import { appendZendeskIdToLogger } from '../../../common/sharedServices/logger'

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

  const piiTypes = data.piiTypes.replace(/,/g, '')
  const piiTypesValidated = !piiTypes.length || /[^,(?! )]+/gm.test(piiTypes)

  const sanitisedPiiTypesList = mapSpaceSeparatedStringToList(
    data.piiTypes
  ).map(removeZendeskPiiTypePrefixFromPiiType)

  const piiTypesAllValid = validateAllSanitisedPiiTypes(sanitisedPiiTypesList)
  const dataPathsList = mapSpaceSeparatedStringToList(data.dataPaths)
  const dataPathsAllValid = validateAllDataPaths(dataPathsList)

  const sanitisedIdentifierType: IdentifierTypes = sanitiseIdentifierType(
    data.identifierType
  )
  const fieldValidation = await validateFields(
    data,
    sanitisedIdentifierType,
    piiTypesAllValid,
    piiTypesValidated,
    dataPathsAllValid
  )

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
      dates:
        data.dateFrom && data.dateFrom.length > 0
          ? [data.dateFrom]
          : mapSpaceSeparatedStringToList(data.dates),
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

const dateListValid = (dateListString: string): boolean => {
  return (
    !!dateListString &&
    dateListString
      .split(' ')
      .map((date) => dateFormatCorrect(date))
      .reduce((a, b) => a && b, dateListString.trim().length > 0)
  )
}

const dateListAllInPast = (dateListString: string): boolean => {
  return (
    !!dateListString &&
    dateListString
      .split(' ')
      .map((date) => dateIsOnOrBeforeToday(date))
      .reduce((a, b) => a && b, dateListString.trim().length > 0)
  )
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

const isEmailValid = (email: string) =>
  /^\w+([.-]?\w+)*@\w+([.-]?\w+)*\.gov.uk$/.test(email ?? '')

const validateAllDataPaths = (dataPathsList: string[]) => {
  return dataPathsList.length
    ? dataPathsList.every((dataPath) => dataPathFormatCorrect(dataPath))
    : true
}

const validateAllSanitisedPiiTypes = (sanitisedPiiTypesList: string[]) => {
  return sanitisedPiiTypesList?.length
    ? sanitisedPiiTypesList.every((type) => validPiiTypes.includes(type))
    : true
}

const validateFields = async (
  data: Record<string, string>,
  sanitisedIdentifierType: IdentifierTypes,
  piiTypesAllValid: boolean,
  piiTypesValidated: boolean,
  dataPathsAllValid: boolean
) => {
  return [
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
      message: 'No dates supplied',
      isValid: !!data.dates || !!data.dateFrom
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
      isValid: !data.dateFrom || dateFormatCorrect(data.dateFrom)
    },
    {
      message: 'dates list is invalid',
      isValid: !data.dates || dateListValid(data.dates)
    },
    {
      message: 'From Date is in the future',
      isValid:
        !data.dateFrom ||
        !dateFormatCorrect(data.dateFrom) ||
        dateIsOnOrBeforeToday(data.dateFrom)
    },
    {
      message: 'One of the requested dates is in the future',
      isValid: !dateListValid(data.dates) || dateListAllInPast(data.dates)
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
}
