import {
  S3ControlClient,
  CreateJobCommand,
  CreateJobCommandInput
} from '@aws-sdk/client-s3-control'
import { getEnv } from '../../utils/helpers'
import { writeJobManifestFileToJobBucket } from './writeJobManifestFileToJobBucket'

const analysisBucketName = getEnv('ANALYSIS_BUCKET_NAME')

// currently no trigger for this function
export const startCopyJob = async (
  filesToCopy: string[],
  zendeskTicketId: string
) => {
  if (filesToCopy?.length < 1) {
    console.warn('startCopyJob called with no files. Not performing any action')
    return
  }

  const manifestFileName = `${analysisBucketName}-copy-job-for-ticket-id-${zendeskTicketId}.csv`
  const manifestFileEtag = await writeJobManifestFileToJobBucket(
    getEnv('AUDIT_BUCKET_NAME'),
    filesToCopy,
    manifestFileName
  )
  console.log(
    `Starting S3 standard tier copying for zendesk ticket with id ${zendeskTicketId}`
  )
  const jobId = await createS3CopyJob(
    manifestFileName,
    manifestFileEtag,
    zendeskTicketId
  )
  console.log(
    `Started S3 copy job for zendesk ticket with id '${zendeskTicketId}', with jobId '${jobId}'`
  )
}

const createS3CopyJob = async (
  manifestFileName: string,
  manifestFileEtag: string,
  zendeskTicketId: string
) => {
  const client = new S3ControlClient({ region: getEnv('AWS_REGION') })
  const input = {
    ConfirmationRequired: false,
    AccountId: getEnv('AWS_ACCOUNT_ID'),
    ClientRequestToken: `${analysisBucketName}-copy-${zendeskTicketId}`,
    RoleArn: getEnv('BATCH_JOB_ROLE_ARN'),
    Priority: 1,
    Operation: {
      S3PutObjectCopy: {
        TargetResource: getEnv('ANALYSIS_BUCKET_ARN')
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
