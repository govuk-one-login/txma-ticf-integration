import {
  DeleteItemCommand,
  GetItemCommand,
  PutItemCommand
} from '@aws-sdk/client-dynamodb'

import { AUDIT_REQUEST_DYNAMODB } from '../../constants/awsParameters'
import {
  ZendeskFormFieldIDs,
  ZENDESK_END_USER_EMAIL,
  ZENDESK_END_USER_NAME
} from '../../constants/zendeskParameters'
import { dynamoDBTicketDetails } from '../../constants/dynamoDBTicketDetails'
import { dynamoDBClient } from './dynamoDBClient'

export const populateDynamoDBWithTestItemDetails = async (ticketID: string) => {
  const ticketDetails = dynamoDBTicketDetails.ticket

  const populateTableParams = {
    TableName: AUDIT_REQUEST_DYNAMODB,
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
              ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_NAME
            )}`
          },
          requesterEmail: {
            S: `${ZENDESK_END_USER_EMAIL}`
          },
          requesterName: {
            S: `${ZENDESK_END_USER_NAME}`
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
    throw 'Error populating dynamoDB'
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
  attributeName?: string
) => {
  let getAttributeValueParams
  if (attributeName) {
    getAttributeValueParams = {
      TableName: AUDIT_REQUEST_DYNAMODB,
      Key: {
        zendeskId: { S: `${ticketId}` }
      },
      ProjectionExpression: attributeName
    }
  } else {
    getAttributeValueParams = {
      TableName: AUDIT_REQUEST_DYNAMODB,
      Key: {
        zendeskId: { S: `${ticketId}` }
      }
    }
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

export const deleteDynamoDBTestItem = async (ticketID: string) => {
  const deleteItemParams = {
    TableName: AUDIT_REQUEST_DYNAMODB,
    Key: {
      zendeskId: { S: ticketID }
    }
  }

  try {
    await dynamoDBClient.send(new DeleteItemCommand(deleteItemParams))
  } catch (error) {
    console.log(error)
    throw 'Error deleting item from dynamoDB'
  }
}
