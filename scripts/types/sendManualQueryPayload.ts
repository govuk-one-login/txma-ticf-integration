export interface SendManualQueryPayload {
  athenaQueryId: string
  recipientEmail: string
  recipientName: string
  zendeskTicketId: string
}

export const validateSendManualQueryPayload = (
  sqsPayload: unknown
): sqsPayload is SendManualQueryPayload => {
  const test = sqsPayload as SendManualQueryPayload
  return (
    typeof test?.zendeskTicketId === 'string' &&
    typeof test?.recipientEmail === 'string' &&
    typeof test?.recipientName === 'string' &&
    typeof test?.athenaQueryId === 'string'
  )
}
