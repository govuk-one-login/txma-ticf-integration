import { ManualAuditDataRequestPayload } from '../types/manualAuditDataRequestPayload'

export const generateInitiateCopyAndDecryptPayload = (
  dates: string[],
  zendeskId: string
): ManualAuditDataRequestPayload => ({
  zendeskId: `MR${zendeskId}`,
  dates,
  requesterEmail: 'manualquery@example.com',
  requesterName: 'txma',
  recipientEmail: 'manualquery@example.com',
  recipientName: '',
  identifierType: 'event_id',
  sessionIds: [],
  journeyIds: [],
  eventIds: [],
  userIds: [],
  piiTypes: [],
  dataPaths: []
})
