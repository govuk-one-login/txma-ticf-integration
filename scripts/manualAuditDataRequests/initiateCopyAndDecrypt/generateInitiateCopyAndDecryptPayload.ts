import { ManualAuditDataRequestPayload } from '../../types/manualAuditDataRequestPayload'

export const generateInitiateCopyAndDecryptPayload = (
  dates: string[],
  zendeskId: string
): ManualAuditDataRequestPayload => ({
  zendeskId: `MR${zendeskId}`,
  dates,
  requesterEmail: 'manualquery@test.gov.uk',
  requesterName: 'txma',
  recipientEmail: 'manualquery@test.gov.uk',
  recipientName: '',
  identifierType: 'event_id',
  sessionIds: [],
  journeyIds: [],
  eventIds: [],
  userIds: [],
  piiTypes: [],
  dataPaths: []
})
