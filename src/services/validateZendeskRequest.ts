import { ValidatedDataRequestParamsResult } from '../types/validatedDataRequestParamsResult'

function isEmpty(obj: object): boolean {
  return obj && Object.keys(obj).length === 0
}

const IDENTIFIERS = ['event_id', 'session_id', 'journey_id']

export const validateZendeskRequest = (
  body: string | null
): ValidatedDataRequestParamsResult => {
  const data = JSON.parse(body ?? '{}')

  if (!isEmpty(data)) {
    const isEmailValid = /^[\w.%+-]+@digital\.cabinet-office\.gov\.uk$/g.test(
      data.resultsEmail ?? ''
    )
    const dateFrom: Date = new Date(data.dateFrom)
    const dateTo: Date = new Date(data.dateTo)

    const piiTypes = data.piiTypes.replace(/,/g, '')
    const piiTypesValidated = /[^,(?! )]+/gm.test(piiTypes)

    const fieldValidation = [
      isEmailValid,
      dateFrom <= dateTo,
      IDENTIFIERS.includes(data.identifierType),
      piiTypesValidated
    ]

    const isValid = fieldValidation.every((element) => element === true)

    return {
      dataRequestParams: {
        ...data
      },
      isValid
    }
  }

  return {
    dataRequestParams: {
      ...data
    },
    isValid: false
  }
}
