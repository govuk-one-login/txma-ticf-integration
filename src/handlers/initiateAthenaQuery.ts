import { SQSEvent } from 'aws-lambda'
import { confirmAthenaTable } from '../services/athena/confirmAthenaTable'
import { getQueryByZendeskId } from '../services/dynamoDB/dynamoDBGet'
import { tryParseJSON } from '../utils/helpers'
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

  const zendeskTicketInfo = tryParseJSON(eventData)
  if (!zendeskTicketInfo.zendeskId) {
    console.error(
      'No Zendesk ticket ID present in SQS event record. Cannot continue or update ticket.'
    )
    throw 'No Zendesk ticket ID present in SQS event record. Cannot continue or update ticket.'
  }

  const requestData = getQueryByZendeskId(zendeskTicketInfo.zendeskId)
  console.log(requestData)

  return
}
