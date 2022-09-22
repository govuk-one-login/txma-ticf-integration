import { mockClient } from 'aws-sdk-client-mock'
import { confirmAthenaTable } from './confirmAthenaTable'
import { GlueClient, GetTableCommand } from '@aws-sdk/client-glue'

const athenaMock = mockClient(GlueClient)

describe('confirm Athena Table', () => {
  beforeEach(() => {
    athenaMock.reset()
  })

  test('athena table exists', async () => {
    athenaMock.on(GetTableCommand).resolves({
      Table: {
        Name: 'test_table'
      }
    })

    const result = await confirmAthenaTable()
    expect(result).toEqual({
      tableAvailable: true,
      message: 'Athena Data Source Table test_table found'
    })
  })

  test('athena table does not exist', async () => {
    athenaMock.on(GetTableCommand).resolves({})

    const result = await confirmAthenaTable()
    expect(result).toEqual({
      tableAvailable: false,
      message: 'Athena Data Source Table test_table not found'
    })
  })
})
