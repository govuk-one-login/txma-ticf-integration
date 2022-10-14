import { PutItemCommand } from '@aws-sdk/client-dynamodb'
// import { PII_FORM_REQUEST_DATE_FIELD_ID } from '../lib/customFieldIDs'
import { getEnvVariable } from '../lib/zendeskParameters'
import { dynamoDBClient } from './awsClients'
import { getTicketDetails } from './zendeskUtils'
import { ZendeskFormFieldIDs } from '../lib/zendeskFormFieldIDs'

const populateTableWithRequestDetails = async (ticketID: string) => {
  const ticketDetails = await getTicketDetails(ticketID)

  const populateTableParams = {
    TableName: getEnvVariable('AUDIT_REQUEST_DYNAMODB_TABLE'),
    ReturnValues: 'ALL_OLD',
    Item: {
      zendeskId: { S: `${ticketID}` },
      requestInfo: {
        M: {
          zendeskId: { S: `${ticketID}` },
          dateFrom: {
            S: `${getCustomFieldValue(
              ticketDetails,
              ZendeskFormFieldIDs.PII_FORM_REQUEST_DATE_FIELD_ID
            )}`
          },
          dateTo: {
            S: `${getCustomFieldValue(
              ticketDetails,
              ZendeskFormFieldIDs.PII_FORM_REQUEST_DATE_FIELD_ID
            )}`
          },
          identifierType: {
            S: `${getFieldValue(
              ticketDetails,
              ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_FIELD_ID
            )}`
          },
          recipientEmail: {
            S: `${getCustomFieldValue(
              ticketDetails,
              ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_EMAIL
            )}`
          },
          recipientName: {
            S: `${getCustomFieldValue(
              ticketDetails,
              ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECEIPIENT_NAME
            )}`
          },
          resultsEmail: {
            S: `${getEnvVariable('ZENDESK_END_USER_EMAIL')}`
          },
          resultsName: {
            S: `${getEnvVariable('ZENDESK_END_USER_NAME')}`
          },
          dataPaths: {
            L: getFieldListValues(
              ticketDetails,
              ZendeskFormFieldIDs.PII_FORM_CUSTOM_DATA_PATH_FIELD_ID
            )
          },
          eventIds: {
            L: getFieldListValues(
              ticketDetails,
              ZendeskFormFieldIDs.PII_FORM_EVENT_ID_LIST_FIELD_ID
            )
          },
          sessionIds: {
            L: getFieldListValues(
              ticketDetails,
              ZendeskFormFieldIDs.PII_FORM_SESSION_ID_LIST_FIELD_ID
            )
          },
          journeyIds: {
            L: getFieldListValues(
              ticketDetails,
              ZendeskFormFieldIDs.PII_FORM_JOURNEY_ID_LIST_FIELD_ID
            )
          },
          userIds: {
            L: getFieldListValues(
              ticketDetails,
              ZendeskFormFieldIDs.PII_FORM_USER_ID_LIST_FIELD_ID
            )
          }
        }
      }
    }
  }

  // const data = await dynamoDBClient.send(
  //   new PutItemCommand(populateTableParams)
  // )
  let data = null
  try {
    data = await dynamoDBClient.send(new PutItemCommand(populateTableParams))
  } catch (error) {
    console.log(error)
  }
  expect(data?.$metadata.httpStatusCode).toEqual(200)
  expect(data?.Attributes?.zendeskId).not.toEqual(ticketID)
}

function getFieldListValues(ticketDetails: { fields: any[] }, fieldID: number) {
  const valueList =
    getFieldValue(ticketDetails, fieldID) == null
      ? []
      : getFieldValue(ticketDetails, fieldID)
          .split(' ')
          .map((item: string) => ({ S: item }))

  console.log(`LIST VALUE FIELD ${fieldID}: ${valueList}`)
  return valueList

  // const value = getFieldValue(ticketDetails, fieldID)
  // if (value == null) {
  //   return []
  // } else {
  //   // L: dataRequestParams.sessionIds.map((id) => ({ S: id }))
  //   const it = value.split(' ').map((item: string) => ({ S: item }))
  //   console.log(`LIST: ${it}`)
  //   return it
  // }
}

function getFieldValue(ticketDetails: { fields: any[] }, fieldID: number) {
  const value = ticketDetails.fields
    .filter((field: { id: number }) => {
      return field.id === fieldID
    })
    .pop().value
  console.log(`FIELD VALUE ${fieldID}: ${value}`)
  return value
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
