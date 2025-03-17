export interface ZendeskRequestData {
  request: ZendeskRequest
}

interface ZendeskRequest {
  subject: string
  ticket_form_id: number
  custom_fields: CustomField[]
  comment: ZendeskComment
}

export interface CustomField {
  id: number
  value: string | string[] | null
}

interface ZendeskComment {
  body: string
}
