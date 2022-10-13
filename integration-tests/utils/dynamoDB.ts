import { PutItemCommand } from '@aws-sdk/client-dynamodb'
import { getEnvVariable } from '../lib/zendeskParameters'
import { dynamoDBClient } from './awsClients'
import { getTicketDetails } from './zendeskUtils'

const populateTableWithRequestDetails = async (ticketID: string) => {
  await getTicketDetails(ticketID)

  const populateTableParams = {
    TableName: getEnvVariable('AUDIT_REQUEST_DYNAMODB_TABLE'),
    ReturnValues: 'ALL_OLD',
    Item: {
      zendeskId: { S: `${ticketID}` },
      requestInfo: {
        M: {
          zendeskId: { S: `${ticketID}` },
          dataPaths: { L: [{ S: '' }, { S: '' }] }, // what are the valid values for this?
          dateFrom: { S: '2022-08-13' },
          dateTo: { S: '2022-08-13' },
          eventIds: { L: [{ S: '637783' }, { S: '3256' }] },
          identifierType: { S: 'event_id' },
          resultsEmail: { S: 'txma-team2-ticf-analyst-dev@test.gov.uk' },
          resultsName: { S: 'Txma-team2-ticf-analyst-dev' }
        }
      }
    }
  }

  const data = await dynamoDBClient.send(
    new PutItemCommand(populateTableParams)
  )
  expect(data.$metadata.httpStatusCode).toEqual(200)
  expect(data.Attributes?.zendeskId).not.toEqual(ticketID)
}

export { populateTableWithRequestDetails }
