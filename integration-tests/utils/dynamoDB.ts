import { GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { getEnvVariable } from '../lib/zendeskParameters'
import { dynamoDBClient } from './awsClients'
import { getTicketDetails } from './zendeskUtils'
import { ZendeskFormFieldIDs } from '../lib/zendeskFormFieldIDs'

export const populateDynamoDBWithRequestDetails = async (ticketID: string) => {
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
            S: `${getFieldValue(
              ticketDetails,
              ZendeskFormFieldIDs.PII_FORM_REQUEST_DATE_FIELD_ID
            )}`
          },
          dateTo: {
            S: `${getFieldValue(
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
            S: `${getFieldValue(
              ticketDetails,
              ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_EMAIL
            )}`
          },
          recipientName: {
            S: `${getFieldValue(
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
          },
          piiTypes: {
            L: getFieldListValues(
              ticketDetails,
              ZendeskFormFieldIDs.PII_FORM_REQUESTED_PII_TYPE_FIELD_ID
            )
          }
        }
      }
    }
  }

  let data = null
  try {
    data = await dynamoDBClient.send(new PutItemCommand(populateTableParams))
  } catch (error) {
    console.log(error)
  }
  expect(data?.Attributes?.zendeskId).not.toEqual(ticketID)
}

function getFieldListValues(ticketDetails: { fields: any[] }, fieldID: number) {
  const value = getFieldValue(ticketDetails, fieldID)
  if (value == null) {
    return []
  } else if (typeof value === 'string') {
    return value.split(' ').map((item: string) => ({ S: item }))
  } else if (value.constructor.name === 'Array') {
    return getFieldValue(ticketDetails, fieldID).map((item: string) => ({
      S: item
    }))
  } else {
    throw Error('Data request parameter not of valid type')
  }
}

function getFieldValue(ticketDetails: { fields: any[] }, fieldID: number) {
  const value = ticketDetails.fields
    .filter((field: { id: number }) => {
      return field.id === fieldID
    })
    .pop().value
  return value
}

export const getValueFromDynamoDB = async (
  ticketId: string,
  attributeName: string
) => {
  const getAttributeValueParams = {
    TableName: getEnvVariable('AUDIT_REQUEST_DYNAMODB_TABLE'),
    Key: {
      zendeskId: { S: `${ticketId}` }
    },
    ProjectionExpression: attributeName
  }

  let item = null
  try {
    item = await dynamoDBClient.send(
      new GetItemCommand(getAttributeValueParams)
    )
    console.log(item.Item)
  } catch (error) {
    console.log(error)
  }
  expect(item?.Item).toBeDefined()
  return item!.Item
}
