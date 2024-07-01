import { ManualAuditDataRequestPayload } from '../../types/manualAuditDataRequestPayload'

export const MOCK_DATA_REQUEST = {
  zendeskId: '123456',
  dates: ['2023-01-01', '2023-01-02'],
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
} as ManualAuditDataRequestPayload
