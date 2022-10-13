export type ZendeskRequestData = {
  request: ZendeskRequest
}

type ZendeskRequest = {
  subject: string
  ticket_form_id: number
  custom_fields: CustomField[]
  comment: ZendeskComment
}

type CustomField = {
  id: number
  value: string | string[] | null
}

type ZendeskComment = {
  body: string
}
