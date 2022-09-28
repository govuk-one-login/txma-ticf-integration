import { createQuerySql } from './createQuerySql'
import {
  testDataRequest,
  noEventIdTestDataRequest
} from '../../utils/tests/testDataRequest'

describe('create Query SQL', () => {
  test('returns a formatted SQL query string', () => {
    expect(createQuerySql(testDataRequest)).toEqual({
      sqlGenerated: true,
      sql: "SELECT restricted FROM test_database.test_table WHERE event_id='123' OR event_id='456'"
    })
  })

  test('returns an error message if there are no ids corresponding to the identifier type', () => {
    expect(createQuerySql(noEventIdTestDataRequest)).toEqual({
      sqlGenerated: false,
      error: 'No ids of type: event_id'
    })
  })
})
