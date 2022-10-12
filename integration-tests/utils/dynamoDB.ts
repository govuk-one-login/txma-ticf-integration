import { PutItemCommand } from '@aws-sdk/client-dynamodb'
import { dynamoDBClient } from './awsClients'

const populateTableWithRequestDetails = async () => {
  const ticketID = ''
  const populateTableParams = {
    TableName:
      'tt2-17-integration-tests-QueryRequestDynamoDBTable-1J802O35H5X8X',
    ReturnValues: 'ALL_OLD',
    Item: {
      zendeskId: { S: '' },
      requestInfo: {
        M: {
          zendeskId: { S: '' },
          dataPaths: { L: [{ S: '' }, { S: '' }] },
          dateFrom: { S: '' },
          dateTo: { S: '' },
          eventIds: { L: [{ S: '' }, { S: '' }] },
          identifierType: { S: '' },
          resultsEmail: { S: '' },
          resultsName: { S: '' }
        }
      }
    }
  }

  const data = await dynamoDBClient.send(
    new PutItemCommand(populateTableParams)
  )
  expect(data.$metadata.httpStatusCode).toEqual(201)
  expect(data.Attributes?.zendeskId).not.toEqual(ticketID)
}

export { populateTableWithRequestDetails }
