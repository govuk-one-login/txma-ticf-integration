import { convertDateRangeToIndividualDateArray } from '../utils/dateUtils'
import { generateInitiateCopyAndDecryptPayload } from './generateInitiateCopyAndDecryptPayload'
import { sendManualAuditDataRequestPayloadToInitiateQueue } from './sendManualAuditDataRequestPayloadToInitiateQueue'

export interface initiateCopyAndDecryptActionTypes {
  zendeskId: string
  dates?: string[]
  daterange?: string[]
}

export const initiateCopyAndDecryptAction = async (
  options: initiateCopyAndDecryptActionTypes
) => {
  const parsedDates: string[] = []
  parsedDates.push(
    ...convertDateRangeToIndividualDateArray(options.daterange ?? [])
  )
  parsedDates.push(...(options.dates ?? []))
  const parsedDatesDeduplicated = Array.from(new Set(parsedDates))
  const payload = generateInitiateCopyAndDecryptPayload(
    parsedDatesDeduplicated,
    options.zendeskId
  )
  await sendManualAuditDataRequestPayloadToInitiateQueue(payload)
}
