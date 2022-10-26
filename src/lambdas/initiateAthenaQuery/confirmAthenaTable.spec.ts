import { confirmAthenaTable } from './confirmAthenaTable'
import { GlueClient, GetTableCommand } from '@aws-sdk/client-glue'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'

const glueMock = mockClient(GlueClient)

describe('confirm Athena Table', () => {
  beforeEach(() => {
    glueMock.reset()
  })

  test('athena table exists', async () => {
    glueMock.on(GetTableCommand).resolves({
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
    glueMock.on(GetTableCommand).resolves({})

    const result = await confirmAthenaTable()
    expect(result).toEqual({
      tableAvailable: false,
      message: 'Athena Data Source Table test_table not found'
    })
  })
})
