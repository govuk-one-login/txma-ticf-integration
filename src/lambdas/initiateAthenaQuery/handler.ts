import { SQSEvent } from 'aws-lambda'
import { confirmAthenaTable } from '../../sharedServices/athena/confirmAthenaTable'
import { createQuerySql } from '../../sharedServices/athena/createQuerySql'
import { getQueryByZendeskId } from '../../sharedServices/dynamoDB/dynamoDBGet'
import { updateQueryByZendeskId } from '../../sharedServices/dynamoDB/dynamoDBUpdate'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'

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

  const querySqlGenerated = createQuerySql(requestData)

  if (!querySqlGenerated.sqlGenerated && querySqlGenerated.error) {
    await updateZendeskTicketById(zendeskId, querySqlGenerated.error, 'closed')
    throw new Error(querySqlGenerated.error)
  }

  if (querySqlGenerated.sql) {
    console.log(
      `Athena SQL generated: ${querySqlGenerated.sql}, parameters: ${querySqlGenerated.idParameters}`
    )
  }

  const update = await updateQueryByZendeskId(
    zendeskId,
    'queryExecutionId',
    '123'
  )

  console.log(update)
  // try startQueryExecution(querySqlGenerated)

  // UPDATE Template.yaml to give athena permissions

  return
}
