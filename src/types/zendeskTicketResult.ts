export interface ZendeskTicketResult {
  ticket: ZendeskTicket
}

export interface ZendeskTicket {
  id: string
  requester_id: string
  custom_fields: CustomField[]
}

export interface CustomField {
  id: string
  value: string
}

export const isZendesktTicketResult = (
  arg: unknown
): arg is ZendeskTicketResult => {
  const test = arg as ZendeskTicketResult
  return (
    typeof test?.ticket.id === 'string' &&
    typeof test?.ticket.requester_id === 'string' &&
    Array.isArray(test.ticket.custom_fields)
  )
}
