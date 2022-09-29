import {
  generateRandomNumber,
  generateZendeskRequestDate
} from '../utils/helpers'

const validRequestData = {
  request: {
    subject: `Integration Test Request - ` + generateRandomNumber(),
    ticket_form_id: 5603412248860,
    custom_fields: [
      {
        id: 5605352623260,
        value: 'event_id'
      },
      {
        id: 5605423021084,
        value: '637783 3256'
      },
      {
        id: 5605700069916,
        value: generateZendeskRequestDate(-60)
      },
      {
        id: 5641719421852,
        value: ['drivers_license']
      },
      {
        id: 5698447116060,
        value: ''
      }
    ],
    comment: {
      body: 'PII request created in integration test'
    }
  }
}

const invalidRequestData = {
  request: {
    subject: `Integration Test Request - ` + generateRandomNumber(),
    ticket_form_id: 5603412248860,
    custom_fields: [
      {
        id: 5605352623260,
        value: 'event_id'
      },
      {
        id: 5605423021084,
        value: '637783 3256'
      },
      {
        id: 5605700069916,
        value: generateZendeskRequestDate(50)
      },
      {
        id: 5641719421852,
        value: ['drivers_license']
      },
      {
        id: 5698447116060,
        value: ''
      }
    ],
    comment: {
      body: 'PII request created in integration test'
    }
  }
}

const ticketApprovalData = {
  ticket: {
    tags: ['process_started', 'approved'],
    custom_fields: [{ id: 5605885870748, value: 'approved' }],
    status: 'open',
    fields: [{ id: 5605885870748, value: 'approved' }],
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

export { validRequestData, ticketApprovalData, invalidRequestData }
