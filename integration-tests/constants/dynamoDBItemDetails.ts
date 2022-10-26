import { DynamoDBItem } from '../types/dynamoDBItem'

export const dynamoDBItemDataPathAndPIITypes: DynamoDBItem = {
  ticket: {
    fields: [
      { id: 360021265420, value: null },
      { id: 5605352623260, value: 'event_id' },
      {
        id: 5605423021084,
        value:
          'd18c56de-1cf0-4641-bdab-3e4212a111cc 488b7ddf-afa7-40a3-8523-352414087f31'
      },
      { id: 5641719421852, value: 'current_address name' },
      { id: 5605700069916, value: '2022-07-01' },
      {
        id: 5698447116060,
        value:
          'restricted.name restricted.birthDate.value restricted.address.buildingNumber'
      },
      {
        id: 6202354485660,
        value: 'txma-team2-ticf-analyst-dev@test.gov.uk'
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
        value: 'd18c56de-1cf0-4641-bdab-3e4212a111cc'
      },
      { id: 5641719421852, value: 'current_address name' },
      { id: 5605700069916, value: '2022-07-01' },
      {
        id: 5698447116060,
        value: ''
      },
      {
        id: 6202354485660,
        value: 'txma-team2-ticf-analyst-dev@test.gov.uk'
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
        value: '488b7ddf-afa7-40a3-8523-352414087f31'
      },
      { id: 5641719421852, value: null },
      { id: 5605700069916, value: '2022-07-01' },
      {
        id: 5698447116060,
        value:
          'restricted.name restricted.birthDate.value restricted.address.buildingNumber'
      },
      {
        id: 6202354485660,
        value: 'txma-team2-ticf-analyst-dev@test.gov.uk'
      },
      { id: 6202301182364, value: 'Integration test person' },
      { id: 5605588962460, value: null },
      { id: 5605573488156, value: null },
      { id: 5605546094108, value: null }
    ]
  }
}
