import { createQuerySql } from './createQuerySql'
import {
  testDataRequest,
  noEventIdTestDataRequest,
  dataPathsTestDataRequest
} from '../../utils/tests/testDataRequest'

describe('create Query SQL', () => {
  test('returns a formatted SQL query string if all conditions satisfied', () => {
    expect(createQuerySql(dataPathsTestDataRequest)).toEqual({
      sqlGenerated: true,
      sql: "SELECT json_extract(restricted, '$.user.firstName') as user_firstname, json_extract(restricted, '$.user.lastName') as user_lastname FROM test_database.test_table WHERE event_id=? OR event_id=?",
      idParameters: ['123', '456']
    })
  })

  test('returns an error message if there are no dataPaths', () => {
    expect(createQuerySql(testDataRequest)).toEqual({
      sqlGenerated: false,
      error: 'No dataPaths in request'
    })
  })

  test('returns an error message if there are no ids corresponding to the identifier type', () => {
    expect(createQuerySql(noEventIdTestDataRequest)).toEqual({
      sqlGenerated: false,
      error: 'No ids of type: event_id'
    })
  })
})
