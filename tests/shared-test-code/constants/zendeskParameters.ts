export const CLOSE_ZENDESK_TICKET_COMMENT =
  'Your ticket has been closed because some fields were invalid. Here is the list of what was wrong: From Date is in the future, To Date is in the future'

export const ZENDESK_END_USER_NAME = 'Txma-team2-ticf-analyst-dev'
export const ZENDESK_RECIPIENT_NAME = 'Test User'
export const ZENDESK_RECIPIENT_EMAIL = 'fake-ticf-recipient@test.gov.uk'
export const ZENDESK_REQUESTER_EMAIL = 'fake-ticf-analyst@test.gov.uk'
export const ZENDESK_REQUESTER_NAME = 'Txma-team2-ticf-analyst-dev'

export const ZENDESK_REQUESTS_ENDPOINT = '/api/v2/requests'
export const ZENDESK_TICKETS_ENDPOINT = '/api/v2/tickets'
export const zendeskConstants: ZendeskConstants = {
  fieldIds: {
    customDataPath: 5698447116060,
    eventIds: 5605423021084,
    identifier: 5605352623260,
    journeyIds: 5605588962460,
    piiTypes: 5641719421852,
    recipientEmail: 6202354485660,
    recipientName: 6202301182364,
    requestDate: 5605700069916,
    sessionIds: 5605573488156,
    status: 5605885870748,
    userIds: 5605546094108
  },
  piiFormId: 5603412248860
}

type ZendeskConstants = {
  readonly fieldIds: ZendeskFieldIds
  readonly piiFormId: number
}

type ZendeskFieldIds = {
  readonly customDataPath: number
  readonly eventIds: number
  readonly identifier: number
  readonly journeyIds: number
  readonly piiTypes: number
  readonly recipientEmail: number
  readonly recipientName: number
  readonly requestDate: number
  readonly sessionIds: number
  readonly status: number
  readonly userIds: number
}
