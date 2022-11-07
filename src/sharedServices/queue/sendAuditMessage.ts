import { AuditQueryDataRequestDetails } from '../../types/audit/auditQueryDataRequestDetails'
export const sendAuditDataRequestMessage = async (
  auditQueryRequestDetails: AuditQueryDataRequestDetails
) => {
  console.log('sending audit data request message', auditQueryRequestDetails)
}

export const sendIllegalRequestAuditMessage = async (zendeskId: string) => {
  console.log('sending illegal request audit message for zendeskId ', zendeskId)
}

export const sendQueryOutputGeneratedAuditMessage = async (
  zendeskId: string
) => {
  console.log(
    'sending query output generated message for zendeskId ',
    zendeskId
  )
}
