import {
  S3ControlClient,
  CreateJobCommand,
  CreateJobCommandInput,
  JobReportScope
} from '@aws-sdk/client-s3-control'
import { batchJobConstants } from '../../constants/batchJobConstants'
import { getFeatureFlagValue } from '../../utils/getFeatureFlagValue'
import { getEnv } from '../../utils/helpers'
import { logger } from '../logger'
import { getAuditDataSourceBucketName } from '../s3/getAuditDataSourceBucketName'
import { writeJobManifestFileToJobBucket } from './writeJobManifestFileToJobBucket'

const analysisBucketName = getEnv('ANALYSIS_BUCKET_NAME')

export const startTransferToAnalysisBucket = async (
  filesToTransfer: string[],
  zendeskTicketId: string
) => {
  if (filesToTransfer?.length < 1) {
    logger.warn(
      'startTransferToAnalysisBucket called with no files. Not performing any action'
    )
    return
  }

  const manifestFileName = `${analysisBucketName}-copy-job-for-ticket-id-${zendeskTicketId}.csv`
  const manifestFileEtag = await writeJobManifestFileToJobBucket(
    getAuditDataSourceBucketName(),
    filesToTransfer,
    manifestFileName
  )
  logger.info(
    `Starting S3 standard tier copying for zendesk ticket with id ${zendeskTicketId}`
  )
  const decryptDataFlagOn = getFeatureFlagValue('DECRYPT_DATA')
  const jobId = await createS3TransferBatchJob(
    manifestFileName,
    manifestFileEtag,
    zendeskTicketId,
    decryptDataFlagOn
  )

  logger.info(
    `Started ${
      decryptDataFlagOn ? 'data decrypt batch job' : 'S3 copy job'
    } for zendesk ticket with id '${zendeskTicketId}', with jobId '${jobId}'`
  )
}

const createS3TransferBatchJob = async (
  manifestFileName: string,
  manifestFileEtag: string,
  zendeskTicketId: string,
  decryptData: boolean
) => {
  const client = new S3ControlClient({ region: getEnv('AWS_REGION') })
  const input = {
    ConfirmationRequired: false,
    AccountId: getEnv('AWS_ACCOUNT_ID'),
    ClientRequestToken: `copy-${zendeskTicketId}`,
    RoleArn: getEnv('BATCH_JOB_ROLE_ARN'),
    Priority: 1,
    Tags: [
      {
        Key: batchJobConstants.transferToAnalysisBucketJobTagName,
        Value: 'true'
      },
      {
        Key: batchJobConstants.zendeskIdTagName,
        Value: zendeskTicketId
      }
    ],
    Operation: {
      ...(decryptData
        ? {
            LambdaInvoke: {
              FunctionArn: getEnv('DECRYPTION_LAMBDA_ARN')
            }
          }
        : {
            S3PutObjectCopy: {
              TargetResource: getEnv('ANALYSIS_BUCKET_ARN')
            }
          })
    },
    Report: {
      Enabled: true,
      Bucket: getEnv('BATCH_JOB_MANIFEST_BUCKET_ARN'),
      Prefix: 'reports',
      Format: 'Report_CSV_20180820',
      ReportScope: JobReportScope.FailedTasksOnly
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
