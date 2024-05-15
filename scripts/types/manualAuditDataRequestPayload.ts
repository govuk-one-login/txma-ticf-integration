import { IdentifierTypes } from '../../src/types/dataRequestParams'

export interface ManualAuditDataRequestPayload {
  zendeskId: string
  dates: string[]
  requesterEmail: string
  requesterName: string
  recipientEmail: string
  recipientName: string
  identifierType: IdentifierTypes
  sessionIds: string[]
  journeyIds: string[]
  eventIds: string[]
  userIds: string[]
  piiTypes: string[]
  dataPaths: string[]
}
