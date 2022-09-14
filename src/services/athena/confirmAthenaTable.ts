import {
  AthenaClient,
  GetTableMetadataCommand,
  GetTableMetadataCommandInput
} from '@aws-sdk/client-athena'
import { getEnv } from '../../utils/helpers'
import { ConfirmAthenaTableResult } from '../../types/confirmAthenaTableResult'

export const confirmAthenaTable = async (
  input: GetTableMetadataCommandInput
): Promise<ConfirmAthenaTableResult> => {
  const client = new AthenaClient({ region: getEnv('AWS_REGION') })
  const command = new GetTableMetadataCommand(input)

  const response = await client.send(command)

  if (!response.TableMetadata) {
    return Promise.resolve({
      tableAvailable: false,
      errorMessage: `Athena Data Source Table ${input.TableName} not found`
    })
  }

  return Promise.resolve({ tableAvailable: true })
}
