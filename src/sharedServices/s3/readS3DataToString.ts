import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getEnv } from '../../utils/helpers'

export const readS3DataToString = async (
  bucketName: string,
  fileKey: string
): Promise<string | undefined> => {
  console.log(`reading file ${fileKey} from bucket ${bucketName}`)

  const s3Client = new S3Client({ region: getEnv('AWS_REGION') })
  const commandInput = {
    Bucket: bucketName,
    Key: fileKey
  }
  const returnedRecipientList = await s3Client.send(
    new GetObjectCommand(commandInput)
  )

  console.log('Returned list of recipients pre handle', returnedRecipientList)

  if (!returnedRecipientList.Body) {
    throw new Error('Valid recipient list not found')
  }

  console.log(
    'handled: ',
    (returnedRecipientList.Body as Buffer).toString('ascii')
  )
  return (returnedRecipientList.Body as Buffer).toString('ascii')
}
