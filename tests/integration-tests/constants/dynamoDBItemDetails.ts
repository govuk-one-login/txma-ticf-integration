import { DynamoDBItem } from '../types/dynamoDBItem'
import { getEnv } from '../../shared-test-code/utils/helpers'

export const dynamoDBItemDataPathAndPIITypes: DynamoDBItem = {
  ticket: {
    fields: [
      { id: 360021265420, value: null },
      { id: 5605352623260, value: 'event_id' },
      {
        id: 5605423021084,
        value: '99cbfa88-5277-422f-af25-be0864adb7db'
      },
      { id: 5641719421852, value: 'addresses' },
      { id: 5605700069916, value: '2022-04-01' },
      {
        id: 5698447116060,
        value:
          'restricted.name restricted.birthDate[0].value restricted.address[0].buildingName'
      },
      {
        id: 6202354485660,
        value: getEnv('ZENDESK_RECIPIENT_EMAIL')
      },
      { id: 6202301182364, value: 'Integration test person' },
      { id: 5605588962460, value: null },
      { id: 5605573488156, value: null },
      { id: 5605546094108, value: null }
    ]
  }
}

export const dynamoDBItemPIITypesOnly: DynamoDBItem = {
  ticket: {
    fields: [
      { id: 360021265420, value: null },
      { id: 5605352623260, value: 'event_id' },
      {
        id: 5605423021084,
        value: '99cbfa88-5277-422f-af25-be0864adb7db'
      },
      { id: 5641719421852, value: 'addresses name' },
      { id: 5605700069916, value: '2022-04-01' },
      {
        id: 5698447116060,
        value: ''
      },
      {
        id: 6202354485660,
        value: getEnv('ZENDESK_RECIPIENT_EMAIL')
      },
      { id: 6202301182364, value: 'Integration test person' },
      { id: 5605588962460, value: null },
      { id: 5605573488156, value: null },
      { id: 5605546094108, value: null }
    ]
  }
}

export const dynamoDBItemDataPathsOnly: DynamoDBItem = {
  ticket: {
    fields: [
      { id: 360021265420, value: null },
      { id: 5605352623260, value: 'event_id' },
      {
        id: 5605423021084,
        value: '99cbfa88-5277-422f-af25-be0864adb7db'
      },
      { id: 5641719421852, value: null },
      { id: 5605700069916, value: '2022-04-01' },
      {
        id: 5698447116060,
        value:
          'restricted.name restricted.birthDate[0].value restricted.address[0].buildingName'
      },
      {
        id: 6202354485660,
        value: getEnv('ZENDESK_RECIPIENT_EMAIL')
      },
      { id: 6202301182364, value: 'Integration test person' },
      { id: 5605588962460, value: null },
      { id: 5605573488156, value: null },
      { id: 5605546094108, value: null }
    ]
  }
}
