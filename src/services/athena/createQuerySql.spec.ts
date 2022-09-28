import { createQuerySql } from './createQuerySql'
import { testDataRequest } from '../../utils/tests/testDataRequest'

describe('create Query SQL', () => {
  test('returns a string', () => {
    expect(createQuerySql(testDataRequest)).toEqual(
      "SELECT restricted FROM test_database.test_table WHERE event_id='123' OR event_id='456'"
    )
  })
})
