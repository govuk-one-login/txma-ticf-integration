import { SQSEvent } from 'aws-lambda'
import { confirmAthenaTable } from '../services/athena/confirmAthenaTable'
import { getQueryByZendeskId } from '../services/dynamoDB/dynamoDBGet'
import { updateZendeskTicketById } from '../services/updateZendeskTicket'

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('Handling Athena Query event', JSON.stringify(event, null, 2))

  if (event.Records.length < 1) {
    throw new Error('No data in Athena Query event')
  }

  const zendeskId = event.Records[0].body
  if (zendeskId.length < 1) {
    throw new Error('No zendeskId recieved from SQS')
  }

  const doesAthenaTableExist = await confirmAthenaTable()

  if (!doesAthenaTableExist.tableAvailable) {
    await updateZendeskTicketById(
      zendeskId,
      doesAthenaTableExist.message,
      'closed'
    )
    throw new Error(doesAthenaTableExist.message)
  }

  const requestData = await getQueryByZendeskId(zendeskId)
  console.log(requestData)

  return
}
