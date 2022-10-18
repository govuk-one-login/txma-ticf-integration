export const queueSendResultsReadyEmail = async (parameters: {
  downloadHash: string
  recipientEmail: string
  recipientName: string
}) => {
  console.log(`Queueing email send for ${parameters.recipientEmail}`)
}
