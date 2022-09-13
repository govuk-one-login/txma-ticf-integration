import { mockClient } from 'aws-sdk-client-mock'
import { confirmAthenaTable } from './confirmAthenaTable'
import {
  AthenaClient,
  GetTableMetadataCommand,
  GetTableMetadataCommandInput
} from '@aws-sdk/client-athena'

const athenaMock = mockClient(AthenaClient)

describe('confirm Athena Table', () => {
  const input: GetTableMetadataCommandInput = {
    CatalogName: 'test catalog',
    DatabaseName: 'test database',
    TableName: 'test table'
  }

  beforeEach(() => {
    athenaMock.reset()
  })

  test('athena table exists', async () => {
    athenaMock.on(GetTableMetadataCommand).resolves({
      TableMetadata: {
        Name: 'test table'
      }
    })

    const result = await confirmAthenaTable(input)
    expect(result).toBe(true)
  })

  test('athena table does not exist', async () => {
    athenaMock.on(GetTableMetadataCommand).resolves({})

    const result = await confirmAthenaTable(input)
    expect(result).toBe(false)
  })
})
