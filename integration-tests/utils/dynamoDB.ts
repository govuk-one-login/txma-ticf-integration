import { PutItemCommand } from '@aws-sdk/client-dynamodb'
// import { PII_FORM_REQUEST_DATE_FIELD_ID } from '../lib/customFieldIDs'
import { getEnvVariable } from '../lib/zendeskParameters'
import { dynamoDBClient } from './awsClients'
import { getTicketDetails } from './zendeskUtils'
import { CustomFieldIDs } from '../lib/customFieldIDs'

const populateTableWithRequestDetails = async (ticketID: string) => {
  const ticketDetails = await getTicketDetails(ticketID)
  getFieldValue(ticketDetails, CustomFieldIDs.PII_FORM_EVENT_ID_LIST_FIELD_ID)

  const populateTableParams = {
    TableName: getEnvVariable('AUDIT_REQUEST_DYNAMODB_TABLE'),
    ReturnValues: 'ALL_OLD',
    Item: {
      zendeskId: { S: `${ticketID}` },
      requestInfo: {
        M: {
          zendeskId: { S: `${ticketID}` },
          dataPaths: { L: [{ S: '' }, { S: '' }] }, // what are the valid values for this?
          dateFrom: {
            S: `'${getCustomFieldValue(
              ticketDetails,
              CustomFieldIDs.PII_FORM_REQUEST_DATE_FIELD_ID
            )}'`
          },

          dateTo: {
            S: `'${getCustomFieldValue(
              ticketDetails,
              CustomFieldIDs.PII_FORM_REQUEST_DATE_FIELD_ID
            )}'`
          },
          eventIds: { L: [{ S: '637783' }, { S: '3256' }] },
          sessionIds: { L: [{ S: '637783' }, { S: '3256' }] },
          journeyIds: { L: [{ S: '637783' }, { S: '3256' }] },
          userIds: { L: [{ S: '637783' }, { S: '3256' }] },
          identifierType: { S: 'event_id' },
          recipientEmail: {
            S: `'${getCustomFieldValue(
              ticketDetails,
              CustomFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_EMAIL
            )}'`
          },
          recipientName: {
            S: `'${getCustomFieldValue(
              ticketDetails,
              CustomFieldIDs.PII_FORM_IDENTIFIER_RECEIPIENT_NAME
            )}'`
          },
          resultsEmail: {
            S: `'${getEnvVariable('ZENDESK_END_USER_EMAIL')}'`
          },
          resultsName: {
            S: `'${getEnvVariable('ZENDESK_END_USER_NAME')}'`
          }
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

function getFieldValue(ticketDetails: { fields: any[] }, fieldID: number) {
  const value = ticketDetails.fields
    .filter((field: { id: number }) => {
      return field.id === fieldID
    })
    .pop().value
  console.log(`FIELD VALUE: ${value}`)
}

function getCustomFieldValue(
  ticketDetails: { custom_fields: any[] },
  customFieldID: number
) {
  const value = ticketDetails.custom_fields
    .filter((custom_field: { id: number }) => {
      return custom_field.id === customFieldID
    })
    .pop().value
  console.log(value)

  return value
}

export { populateTableWithRequestDetails }
