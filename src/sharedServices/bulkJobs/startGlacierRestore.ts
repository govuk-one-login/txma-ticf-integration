import {
  S3ControlClient,
  CreateJobCommand,
  CreateJobCommandInput
} from '@aws-sdk/client-s3-control'
import { getEnv } from '../../utils/helpers'
import { logger } from '../logger'
import { writeJobManifestFileToJobBucket } from './writeJobManifestFileToJobBucket'

const analysisBucketName = getEnv('ANALYSIS_BUCKET_NAME')

export const startGlacierRestore = async (
  filesToRestore: string[],
  zendeskTicketId: string
) => {
  if (filesToRestore?.length < 1) {
    logger.warn(
      'startGlacierRestore called with no files. Not performing any action'
    )
    return
  }

  const manifestFileName = `${analysisBucketName}-glacier-restore-for-ticket-id-${zendeskTicketId}.csv`
  const manifestFileEtag = await writeJobManifestFileToJobBucket(
    getEnv('AUDIT_BUCKET_NAME'),
    filesToRestore,
    manifestFileName
  )
  logger.info(
    `Starting Glacier restore for zendesk ticket with id '${zendeskTicketId}'`
  )
  const jobId = await createBulkGlacierRestoreJob(
    manifestFileName,
    manifestFileEtag,
    zendeskTicketId
  )
  logger.info(
    `Started Glacier restore for zendesk ticket with id '${zendeskTicketId}', with jobId '${jobId}'`
  )
}

const createBulkGlacierRestoreJob = async (
  manifestFileName: string,
  manifestFileEtag: string,
  zendeskTicketId: string
): Promise<string | undefined> => {
  const client = new S3ControlClient({ region: getEnv('AWS_REGION') })
  const input = {
    ConfirmationRequired: false,
    ClientRequestToken: `restore-${zendeskTicketId}`,
    AccountId: getEnv('AWS_ACCOUNT_ID'),
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
