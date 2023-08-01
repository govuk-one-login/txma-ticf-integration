export interface sendManualQueryPayload {
  athenaQueryId: string
  recipientEmail: string
  recipientName: string
  zendeskTicketId: string
}

export const validateSendManualQueryPayload = (
  sqsPayload: unknown
): sqsPayload is sendManualQueryPayload => {
  const test = sqsPayload as sendManualQueryPayload
  return (
    typeof test?.zendeskTicketId === 'string' &&
    typeof test?.recipientEmail === 'string' &&
    typeof test?.recipientName === 'string' &&
    typeof test?.athenaQueryId === 'string'
  )
}
