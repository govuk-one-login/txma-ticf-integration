import { convertDateRangeToDateArray } from '../utils/dateUtils'
import { generateInitiateCopyAndDecryptPayload } from './generateInitiateCopyAndDecryptPayload'
import { sendManualAuditDataRequestPayloadToInitiateQueue } from './sendManualAuditDataRequestPayloadToInitiateQueue'

export type initiateCopyAndDecryptActionTypes = {
  zendeskId: string
  dates?: string[]
  daterange?: string[]
}

export const initiateCopyAndDecryptAction = async (
  options: initiateCopyAndDecryptActionTypes
) => {
  const parsedDates: string[] = []
  parsedDates.push(...convertDateRangeToDateArray(options.daterange ?? []))
  parsedDates.push(...(options.dates ?? []))
  const payload = generateInitiateCopyAndDecryptPayload(
    parsedDates,
    options.zendeskId
  )
  await sendManualAuditDataRequestPayloadToInitiateQueue(payload)
}
