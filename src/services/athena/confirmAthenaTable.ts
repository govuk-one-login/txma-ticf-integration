import {
  AthenaClient,
  GetTableMetadataCommand,
  GetTableMetadataCommandInput
} from '@aws-sdk/client-athena'
import { getEnv } from '../../utils/helpers'

export const confirmAthenaTable = async (
  input: GetTableMetadataCommandInput
): Promise<boolean> => {
  const client = new AthenaClient({ region: getEnv('AWS_REGION') })
  const command = new GetTableMetadataCommand(input)

  try {
    const response = await client.send(command)
    return response.TableMetadata?.Name === input.TableName
  } catch (error) {
    console.log(error)
    return Promise.reject(error)
  }
}
