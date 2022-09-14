import {
  GlueClient,
  GetTableCommand,
  GetTableCommandInput
} from '@aws-sdk/client-glue'
import { getEnv } from '../../utils/helpers'
import { ConfirmAthenaTableResult } from '../../types/confirmAthenaTableResult'

export const confirmAthenaTable = async (
  input: GetTableCommandInput
): Promise<ConfirmAthenaTableResult> => {
  const client = new GlueClient({ region: getEnv('AWS_REGION') })
  const command = new GetTableCommand(input)

  try {
    const response = await client.send(command)
    if (!response.Table) {
      return Promise.resolve({
        tableAvailable: false,
        message: `Athena Data Source Table ${input.Name} not found`
      })
    }
    return Promise.resolve({
      tableAvailable: true,
      message: `Athena Data Source Table ${response.Table.Name} found`
    })
  } catch (error) {
    return Promise.reject(error)
  }
}
