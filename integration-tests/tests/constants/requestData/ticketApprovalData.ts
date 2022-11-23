import { ZendeskFormFieldIDs } from '../zendeskParameters'

export const ticketApprovalData = {
  ticket: {
    tags: ['process_started', 'approved'],
    custom_fields: [
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUEST_STATUS_FIELD_ID,
        value: 'approved'
      }
    ],
    status: 'open',
    fields: [
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUEST_STATUS_FIELD_ID,
        value: 'approved'
      }
    ],
    collaborator_ids: [],
    follower_ids: [],
    comment: {
      body: '<p>Request <b>APPROVED</b> and data retrieval has started...</p>',
      html_body:
        '<p>Request <b>APPROVED</b> and data retrieval has started...</p>',
      public: 'true'
    }
  }
}
