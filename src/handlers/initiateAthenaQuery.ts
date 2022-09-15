import { SQSEvent } from 'aws-lambda'
import { confirmAthenaTable } from '../services/athena/confirmAthenaTable'
import { getEnv } from '../utils/helpers'

const database: string = getEnv('ATHENA_DATABASE_NAME') || ''
const table: string = getEnv('ATHENA_TABLE_NAME') || ''

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('Handling Athena Query event', JSON.stringify(event, null, 2))

  if (event.Records.length < 1) {
    throw new Error('No data in Athena Query event')
  }

  const input = {
    DatabaseName: database,
    Name: table
  }

  const athenaTableExists = await confirmAthenaTable(input)

  console.log(athenaTableExists.message)

  return
}
