/* eslint-disable no-console */
import {
  HeadObjectCommand,
  RestoreObjectCommand,
  RestoreObjectCommandInput,
  S3Client
} from '@aws-sdk/client-s3'
import { RateLimit } from 'async-sema'

const rps = RateLimit(100)

const payload = {
  level: 'INFO',
  message: 'glacierTierLocationsToCopy',
  service: 'service_undefined',
  timestamp: '2024-07-19T10:38:03.619Z',
  glacierTierLocationsToCopy: [
    'firehose/2024/04/17/23/audit-message-batch-40-2024-04-17-23-52-50-28175147-5d3f-4b6f-ab12-173274aee908.gz'
  ]
}

const s3 = new S3Client({ region: 'eu-west-2' })

export const expedite = async () => {
  const res = payload.glacierTierLocationsToCopy.map(async (obj) => {
    const restoreCommand: RestoreObjectCommandInput = {
      Bucket: 'audit-production-permanent-message-batch',
      Key: obj,
      RestoreRequest: {
        Days: 5,
        GlacierJobParameters: {
          Tier: 'Expedited'
        }
      }
    }
    await rps()
    const res = await s3.send(new RestoreObjectCommand(restoreCommand))
    console.log(
      'restored ' +
        obj +
        '. Response from restore command: ' +
        res.RestoreOutputPath
    )
  })

  await Promise.allSettled(res)
}

export const inspect = async () => {
  const promiseArray = payload.glacierTierLocationsToCopy.map(async (obj) => {
    const headCommand = {
      Bucket: 'audit-production-permanent-message-batch',
      Key: obj
    }

    await rps()
    const res = await s3.send(new HeadObjectCommand(headCommand))
    console.log('object: ' + obj + ' restore status: ' + res.Restore)
  })

  await Promise.allSettled(promiseArray)
}

expedite().then(() => {
  console.log('complete')
})
