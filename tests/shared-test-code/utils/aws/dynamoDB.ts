import { currentDateEpochSeconds } from '../helpers'
import { zendeskConstants } from '../../constants/zendeskParameters'
import { getEnv } from '../helpers'
import { invokeLambdaFunction } from './invokeLambdaFunction'
import { CustomField, ZendeskRequestData } from '../../types/zendeskRequestData'

export const getValueFromDynamoDB = async (
  tableName: string,
  zendeskId: string,
  desiredAttributeName?: string
) => {
  return await invokeLambdaFunction(getEnv('DYNAMO_OPERATIONS_FUNCTION_NAME'), {
    operation: 'GET',
    params: {
      tableName,
      key: { zendeskId },
      ...(desiredAttributeName && { desiredAttributeName })
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
    params: { tableName, key: { zendeskId } }
  })
}

const getFieldListValues = (customFields: CustomField[], id: number) => {
  const value = getFieldValue(customFields, id)
  if (value == null) {
    return []
  } else if (typeof value === 'string') {
    return value.split(' ').map((item: string) => item)
  } else if (Array.isArray(value)) {
    return value.map((item: string) => item)
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
  ttl: calculateDatabaseExpiryTime().toString(),
  zendeskId,
  requestInfo: {
    zendeskId,
    dates: getFieldListValues(
      customFields,
      zendeskConstants.fieldIds.datesList
    ),
    identifierType: `${getFieldValue(
      customFields,
      zendeskConstants.fieldIds.identifier
    )}`,
    recipientEmail: `${getFieldValue(
      customFields,
      zendeskConstants.fieldIds.recipientEmail
    )}`,
    recipientName: `${getFieldValue(
      customFields,
      zendeskConstants.fieldIds.recipientName
    )}`,
    requesterEmail: `${getEnv('ZENDESK_END_USER_EMAIL')}`,
    requesterName: `${getEnv('ZENDESK_END_USER_NAME')}`,
    dataPaths: getFieldListValues(
      customFields,
      zendeskConstants.fieldIds.customDataPath
    ),
    eventIds: getFieldListValues(
      customFields,
      zendeskConstants.fieldIds.eventIds
    ),
    sessionIds: getFieldListValues(
      customFields,
      zendeskConstants.fieldIds.sessionIds
    ),
    journeyIds: getFieldListValues(
      customFields,
      zendeskConstants.fieldIds.journeyIds
    ),
    userIds: getFieldListValues(
      customFields,
      zendeskConstants.fieldIds.userIds
    ),
    piiTypes: getFieldListValues(
      customFields,
      zendeskConstants.fieldIds.piiTypes
    ).map((item) =>
      // Need to cater for the fact that the Zendesk ticket
      // will have a prefix before the PII type that we store in the database
      item.replace(zendeskConstants.piiTypesPrefix, '')
    )
  }
})
