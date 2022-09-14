import { SQSEvent } from 'aws-lambda'
import { confirmAthenaTable } from '../services/athena/confirmAthenaTable'
import { getEnv } from '../utils/helpers'

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('Handling Athena Query event', JSON.stringify(event, null, 2))

  const input = {
    DatabaseName: getEnv('ATHENA_DATABASE_NAME'),
    Name: getEnv('ATHENA_TABLE_NAME')
  }

  const athenaTableExists = await confirmAthenaTable(input)

  console.log(athenaTableExists.message)

  return
}
