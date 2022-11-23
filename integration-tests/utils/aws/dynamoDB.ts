import {
  ZendeskFormFieldIDs,
  ZENDESK_END_USER_EMAIL,
  ZENDESK_END_USER_NAME
} from '../../constants/zendeskParameters'
import { DynamoDBItem, ItemDetails } from '../../types/dynamoDBItem'
import { invokeDynamoOperationsLambda } from './invokeDynamoOperationsLambda'

export const getValueFromDynamoDB = async (
  ticketId: string,
  attributeName?: string
) => {
  return await invokeDynamoOperationsLambda({
    operation: 'GET',
    params: {
      zendeskId: ticketId,
      ...(attributeName && { attributeName })
    }
  })
}

export const populateDynamoDBWithTestItemDetails = async (
  ticketID: string,
  itemDetails: DynamoDBItem
) => {
  return await invokeDynamoOperationsLambda({
    operation: 'PUT',
    params: {
      itemToPut: generateDynamoTableEntry(ticketID, itemDetails.ticket)
    }
  })
}

export const deleteDynamoDBTestItem = async (ticketID: string) => {
  return await invokeDynamoOperationsLambda({
    operation: 'DELETE',
    params: { zendeskId: ticketID }
  })
}

const getFieldListValues = (ticketDetails: ItemDetails, fieldID: number) => {
  const value = getFieldValue(ticketDetails, fieldID)
  if (value == null) {
    return []
  } else if (typeof value === 'string') {
    return value.split(' ').map((item: string) => ({ S: item }))
  } else if (value.constructor.name === 'Array') {
    return value.map((item: string) => ({
      S: item
    }))
  } else {
    throw Error('Data request parameter not of valid type')
  }
}

const getFieldValue = (ticketDetails: ItemDetails, fieldID: number) => {
  const field = ticketDetails.fields.filter((field) => {
    return field.id === fieldID
  })
  return field.pop()?.value
}

const generateDynamoTableEntry = (
  ticketId: string,
  ticketDetails: ItemDetails
) => {
  return {
    zendeskId: { S: `${ticketId}` },
    requestInfo: {
      M: {
        zendeskId: { S: `${ticketId}` },
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
