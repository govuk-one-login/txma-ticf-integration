import { checkS3BucketData } from '../../src/sharedServices/s3/checkS3BucketData'
import {
  generateCopyAndDecryptPayload,
  initiateCopyAndDecryptActionTypes
} from '../initiateCopyAndDecrypt/manualAuditDataRequestInitiateCopyAndDecryptAction'

export const inspectDataRetrieval = async (
  options: initiateCopyAndDecryptActionTypes
) => {
  const payload = generateCopyAndDecryptPayload(options)
  // await checkS3BucketData({
  //   zendeskId: payload.zendeskId,
  //   dates: payload.dates,
  //   dataPaths: payload.dataPaths,
  //   eventIds: payload.eventIds,
  //   identifierType: payload.identifierType as IdentifierTypes,
  //   journeyIds: payload.journeyIds,
  //   piiTypes: payload.piiTypes,
  //   recipientEmail: payload.recipientEmail,
  //   recipientName: payload.recipientName,
  //   requesterEmail: payload.recipientEmail,
  //   requesterName: payload.requesterName,
  //   sessionIds: payload.sessionIds,
  //   userIds: payload.userIds
  // })
  await checkS3BucketData(payload)
}
