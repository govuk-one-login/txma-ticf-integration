import { mockClient } from 'aws-sdk-client-mock'
import { confirmAthenaTable } from './confirmAthenaTable'
import {
  GlueClient,
  GetTableCommand,
  GetTableCommandInput
} from '@aws-sdk/client-glue'

const athenaMock = mockClient(GlueClient)

describe('confirm Athena Table', () => {
  const input: GetTableCommandInput = {
    DatabaseName: 'test database',
    Name: 'test table'
  }

  beforeEach(() => {
    athenaMock.reset()
  })

  test('athena table exists', async () => {
    athenaMock.on(GetTableCommand).resolves({
      Table: {
        Name: 'test table'
      }
    })

    const result = await confirmAthenaTable(input)
    expect(result).toEqual({
      tableAvailable: true,
      message: 'Athena Data Source Table test table found'
    })
  })

  test('athena table does not exist', async () => {
    athenaMock.on(GetTableCommand).resolves({})

    const result = await confirmAthenaTable(input)
    expect(result).toEqual({
      tableAvailable: false,
      message: 'Athena Data Source Table test table not found'
    })
  })
})
