import { convertDaterangeToDateArray } from '../utils/dateUtils'
import { generateInitiateCopyAndDecryptPayload } from './generateInitiateCopyAndDecryptPayload'
import { sendManualAuditDataRequestPayloadToInitiateQueue } from './sendManualAuditDataRequestPayloadToInitiateQueue'

export type initiateCopyAndDecrypActionTypes = {
  zendeskId: string
  dates?: string[]
  daterange?: string[]
}

export const initiateCopyAndDecryptAction = async (
  options: initiateCopyAndDecrypActionTypes
) => {
  const parsedDates: string[] = []
  parsedDates.push(...convertDaterangeToDateArray(options.daterange ?? []))
  parsedDates.push(...(options.dates ?? []))
  const payload = generateInitiateCopyAndDecryptPayload(
    parsedDates,
    options.zendeskId
  )
  await sendManualAuditDataRequestPayloadToInitiateQueue(payload)
}
