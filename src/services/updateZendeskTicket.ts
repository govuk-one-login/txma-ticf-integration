export const updateZendeskTicket = (
  requestBody: string | null,
  message: string
) => {
  console.log(
    `Updating Zendesk Ticket. Request body was ${requestBody}. Message: ${message}`
  )
}
