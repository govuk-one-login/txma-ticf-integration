import { SQSEvent } from 'aws-lambda'
import { confirmAthenaTable } from '../services/athena/confirmAthenaTable'
// import { updateZendeskTicket } from '../services/updateZendeskTicket'

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('Handling Athena Query event', JSON.stringify(event, null, 2))

  if (event.Records.length < 1) {
    throw new Error('No data in Athena Query event')
  }

  const doesAthenaTableExist = await confirmAthenaTable()

  // NOTE - This will need to be updated once the mechanism for retrieving the Zendesk Ticket information is finalised
  // Zendesk Ticket ID could be passed in the SQS Event or could be retrieved from a database
  if (!doesAthenaTableExist.tableAvailable) {
    //   await updateZendeskTicket('zendeskevent', doesAthenaTableExist.message, 'closed')
    throw new Error(doesAthenaTableExist.message)
  }

  console.log(doesAthenaTableExist.message)

  return
}
