import {
  S3ControlClient,
  CreateJobCommand,
  CreateJobCommandInput
} from '@aws-sdk/client-s3-control'
import { getEnv } from '../../utils/helpers'
import { writeJobManifestFileToJobBucket } from './writeJobManifestFileToJobBucket'
export const startGlacierDefrost = async (
  filesToDefrost: string[],
  zendeskTicketId: string
) => {
  if (filesToDefrost?.length < 1) {
    console.warn(
      'startGlacierDefrost called with no files. Not performing any action'
    )
    return
  }

  const manifestFileName = `glacier-defrost-for-ticket-id-${zendeskTicketId}.csv`
  const manifestFileEtag = await writeJobManifestFileToJobBucket(
    getEnv('AUDIT_BUCKET_NAME'),
    filesToDefrost,
    manifestFileName
  )
  console.log(
    `Starting Glacier defrost for zendesk ticket with id '${zendeskTicketId}'`
  )
  const jobId = await createBulkDefrostJob(
    manifestFileName,
    manifestFileEtag,
    zendeskTicketId
  )
  console.log(
    `Started Glacier defrost for zendesk ticket with id '${zendeskTicketId}', with jobId '${jobId}'`
  )
}

const createBulkDefrostJob = async (
  manifestFileName: string,
  manifestFileEtag: string,
  zendeskTicketId: string
): Promise<string | undefined> => {
  const client = new S3ControlClient({ region: getEnv('AWS_REGION') })
  const input = {
    ClientRequestToken: `glacier-defrost-for-ticket-id-${zendeskTicketId}`,
    AccountId: getEnv('ACCOUNT_ID'),
    RoleArn: getEnv('BATCH_JOB_ROLE_ARN'),
    Priority: 1,
    Operation: {
      S3InitiateRestoreObject: {
        ExpirationInDays: 5,
        GlacierJobTier: 'BULK'
      }
    },
    Report: {
      Enabled: false
    },
    Manifest: {
      Spec: {
        Format: 'S3BatchOperations_CSV_20180820',
        Fields: ['Bucket', 'Key']
      },
      Location: {
        ObjectArn: `${getEnv(
          'BATCH_JOB_MANIFEST_BUCKET_ARN'
        )}/${manifestFileName}`,
        ETag: manifestFileEtag
      }
    }
  } as CreateJobCommandInput
  const result = await client.send(new CreateJobCommand(input))
  return result.JobId
}
