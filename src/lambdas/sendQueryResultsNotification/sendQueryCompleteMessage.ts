export const sendQueryCompleteMessage = async (parameters: {
  athenaQueryId: string
  recipientEmail: string
  recipientName: string
  zendeskTicketId: string
}) => {
  // TODO: remove this log line once implemented
  console.log('sending query complete message', parameters)
}
