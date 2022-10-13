import { createQuerySql } from './createQuerySql'
import {
  testDataRequest,
  noIdTestDataRequest,
  dataPathsTestDataRequest
} from '../../utils/tests/testDataRequest'
import { IdentifierTypes } from '../../types/dataRequestParams'

describe('create Query SQL', () => {
  it.each(['event_id', 'session_id', 'journey_id', 'user_id'])(
    `returns a formatted SQL query if conditions satisfied`,
    (id) => {
      dataPathsTestDataRequest.identifierType = id as IdentifierTypes
      const idExtension = id.charAt(0)
      expect(createQuerySql(dataPathsTestDataRequest)).toEqual({
        sqlGenerated: true,
        sql: `SELECT json_extract(restricted, '$.user.firstName') as user_firstname, json_extract(restricted, '$.user.lastName') as user_lastname FROM test_database.test_table WHERE ${id} IN (?, ?)`,
        idParameters: [`123${idExtension}`, `456${idExtension}`]
      })
    }
  )

  test('returns an error message if there are no dataPaths', () => {
    expect(createQuerySql(testDataRequest)).toEqual({
      sqlGenerated: false,
      error: 'No dataPaths in request'
    })
  })

  it.each(['event_id', 'session_id', 'journey_id', 'user_id'])(
    `returns an error message if there are no ids corresponding to %p`,
    (id) => {
      noIdTestDataRequest.identifierType = id as IdentifierTypes
      expect(createQuerySql(noIdTestDataRequest)).toEqual({
        sqlGenerated: false,
        error: `No ids of type: ${id}`
      })
    }
  )
})