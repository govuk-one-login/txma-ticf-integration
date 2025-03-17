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
    datesList: 7585654162972,
    sessionIds: 5605573488156,
    status: 5605885870748,
    userIds: 5605546094108
  },
  piiFormId: 5603412248860,
  piiTypesPrefix: 'pii_requested_'
}

interface ZendeskConstants {
  readonly fieldIds: ZendeskFieldIds
  readonly piiFormId: number
  readonly piiTypesPrefix: string
}

interface ZendeskFieldIds {
  readonly customDataPath: number
  readonly eventIds: number
  readonly identifier: number
  readonly journeyIds: number
  readonly piiTypes: number
  readonly recipientEmail: number
  readonly recipientName: number
  readonly requestDate: number
  readonly datesList: number
  readonly sessionIds: number
  readonly status: number
  readonly userIds: number
}
