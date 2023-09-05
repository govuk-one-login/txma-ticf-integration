import { ManualAuditDataRequestPayload } from '../../types/manualAuditDataRequestPayload'

export const testDataRequest = {
  zendeskId: '123456',
  dates: ['2023-01-01', '2023-01-02'],
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
} as ManualAuditDataRequestPayload
