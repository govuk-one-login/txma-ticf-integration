import { currentDateEpochSeconds } from '../helpers'
import { zendeskConstants } from '../../constants/zendeskParameters'
import { getEnv } from '../helpers'
import { invokeLambdaFunction } from './invokeLambdaFunction'
import { CustomField, ZendeskRequestData } from '../../types/zendeskRequestData'

export const getValueFromDynamoDB = async (
  tableName: string,
  zendeskId: string,
  attributeName?: string
) => {
  return await invokeLambdaFunction(getEnv('DYNAMO_OPERATIONS_FUNCTION_NAME'), {
    operation: 'GET',
    params: {
      tableName,
      zendeskId,
      ...(attributeName && { attributeName })
    }
  })
}

export const populateDynamoDBWithTestItemDetails = async (
  tableName: string,
  zendeskId: string,
  zendeskTicketData: ZendeskRequestData
) => {
  return await invokeLambdaFunction(getEnv('DYNAMO_OPERATIONS_FUNCTION_NAME'), {
    operation: 'PUT',
    params: {
      tableName,
      itemToPut: generateDynamoTableEntry(
        zendeskId,
        zendeskTicketData.request.custom_fields
      )
    }
  })
}

export const deleteDynamoDBTestItem = async (
  tableName: string,
  zendeskId: string
) => {
  return await invokeLambdaFunction(getEnv('DYNAMO_OPERATIONS_FUNCTION_NAME'), {
    operation: 'DELETE',
    params: { tableName, zendeskId }
  })
}

const getFieldListValues = (customFields: CustomField[], id: number) => {
  const value = getFieldValue(customFields, id)
  if (value == null) {
    return []
  } else if (typeof value === 'string') {
    return value.split(' ').map((item: string) => ({ S: item }))
  } else if (Array.isArray(value)) {
    return value.map((item: string) => ({
      S: item
    }))
  } else {
    throw Error('Data request parameter not of valid type')
  }
}

const getFieldValue = (customFields: CustomField[], id: number) => {
  const field = customFields.filter((field) => {
    return field.id === id
  })
  return field.pop()?.value
}

const fiveDaysInSeconds = 5 * 24 * 60 * 60

const calculateDatabaseExpiryTime = () =>
  currentDateEpochSeconds() + fiveDaysInSeconds

const generateDynamoTableEntry = (
  zendeskId: string,
  customFields: CustomField[]
) => ({
  ttl: { N: calculateDatabaseExpiryTime().toString() },
  zendeskId: { S: `${zendeskId}` },
  requestInfo: {
    M: {
      zendeskId: { S: `${zendeskId}` },
      dateFrom: {
        S: `${getFieldValue(
          customFields,
          zendeskConstants.fieldIds.requestDate
        )}`
      },
      dateTo: {
        S: `${getFieldValue(
          customFields,
          zendeskConstants.fieldIds.requestDate
        )}`
      },
      identifierType: {
        S: `${getFieldValue(
          customFields,
          zendeskConstants.fieldIds.identifier
        )}`
      },
      recipientEmail: {
        S: `${getFieldValue(
          customFields,
          zendeskConstants.fieldIds.recipientEmail
        )}`
      },
      recipientName: {
        S: `${getFieldValue(
          customFields,
          zendeskConstants.fieldIds.recipientName
        )}`
      },
      requesterEmail: {
        S: `${getEnv('ZENDESK_END_USER_EMAIL')}`
      },
      requesterName: {
        S: `${getEnv('ZENDESK_END_USER_NAME')}`
      },
      dataPaths: {
        L: getFieldListValues(
          customFields,
          zendeskConstants.fieldIds.customDataPath
        )
      },
      eventIds: {
        L: getFieldListValues(customFields, zendeskConstants.fieldIds.eventIds)
      },
      sessionIds: {
        L: getFieldListValues(
          customFields,
          zendeskConstants.fieldIds.sessionIds
        )
      },
      journeyIds: {
        L: getFieldListValues(
          customFields,
          zendeskConstants.fieldIds.journeyIds
        )
      },
      userIds: {
        L: getFieldListValues(customFields, zendeskConstants.fieldIds.userIds)
      },
      piiTypes: {
        L: getFieldListValues(
          customFields,
          zendeskConstants.fieldIds.piiTypes
        ).map((item) => ({
          // Need to cater for the fact that the Zendesk ticket
          // will have a prefix before the PII type that we store in the database
          S: item.S.replace(zendeskConstants.piiTypesPrefix, '')
        }))
      }
    }
  }
})
