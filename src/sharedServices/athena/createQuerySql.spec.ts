import { createQuerySql } from './createQuerySql'
import {
  testDataRequest,
  noEventIdTestDataRequest,
  dataPathsTestDataRequest
} from '../../utils/tests/testDataRequest'
import { IdentifierTypes } from '../../types/dataRequestParams'

describe('create Query SQL', () => {
  test('returns a formatted SQL query string if all conditions satisfied', () => {
    expect(createQuerySql(dataPathsTestDataRequest)).toEqual({
      sqlGenerated: true,
      sql: "SELECT json_extract(restricted, '$.user.firstName') as user_firstname, json_extract(restricted, '$.user.lastName') as user_lastname FROM test_database.test_table WHERE event_id IN (?, ?)",
      idParameters: ['123', '456']
    })
  })

  test('returns an error message if there are no dataPaths', () => {
    expect(createQuerySql(testDataRequest)).toEqual({
      sqlGenerated: false,
      error: 'No dataPaths in request'
    })
  })

  it.each(['event_id', 'session_id', 'jounrney_id', 'user_id'])(
    `returns an error message if there are no ids corresponding to %p`,
    (id) => {
      noEventIdTestDataRequest.identifierType = id as IdentifierTypes
      expect(createQuerySql(noEventIdTestDataRequest)).toEqual({
        sqlGenerated: false,
        error: `No ids of type: ${id}`
      })
    }
  )
})
