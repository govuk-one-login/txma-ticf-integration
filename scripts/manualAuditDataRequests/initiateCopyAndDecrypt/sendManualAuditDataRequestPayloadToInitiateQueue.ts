import { sendSqsMessage } from '../../sharedServices/aws/sqs/sendSqsMessage'
import { getAwsAccountNumber } from '../../sharedServices/aws/sts/getAwsAccountNumber'
import { ManualAuditDataRequestPayload } from '../../types/manualAuditDataRequestPayload'

export const sendManualAuditDataRequestPayloadToInitiateQueue = async (
  payload: ManualAuditDataRequestPayload
): Promise<void> => {
  const queueUrl = `https://sqs.eu-west-2.amazonaws.com/${await getAwsAccountNumber()}/txma-ticf-integration-initiate-data-request-queue`
  await sendSqsMessage(payload, queueUrl)
}
