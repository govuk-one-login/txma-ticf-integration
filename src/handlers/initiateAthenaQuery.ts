import { SQSEvent } from 'aws-lambda'
import { confirmAthenaTable } from '../services/athena/confirmAthenaTable'
import { updateZendeskTicket } from '../services/updateZendeskTicket'

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('Handling Athena Query event', JSON.stringify(event, null, 2))

  if (event.Records.length < 1) {
    throw new Error('No data in Athena Query event')
  }

  const eventData = event.Records[0].body

  const doesAthenaTableExist = await confirmAthenaTable()

  if (!doesAthenaTableExist.tableAvailable) {
    await updateZendeskTicket(eventData, doesAthenaTableExist.message, 'closed')
    throw new Error(doesAthenaTableExist.message)
  }

  console.log(doesAthenaTableExist.message)

  return
}
