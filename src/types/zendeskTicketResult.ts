export interface ZendeskTicketResult {
  ticket: ZendeskTicket
}

export interface ZendeskTicket {
  id: number
  requester_id: number
  custom_fields: CustomField[]
}

export interface CustomField {
  id: number
  value: string | null
}

export const isZendeskTicketResult = (
  arg: unknown
): arg is ZendeskTicketResult => {
  const test = arg as ZendeskTicketResult
  return (
    typeof test?.ticket.id === 'number' &&
    typeof test?.ticket.requester_id === 'number' &&
    Array.isArray(test.ticket.custom_fields)
  )
}
