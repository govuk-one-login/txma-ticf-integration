import { createQuerySql } from './createQuerySql'
import { testDataRequest } from '../../utils/tests/testDataRequest'

describe('create Query SQL', () => {
  test('returns a string', () => {
    expect(createQuerySql(testDataRequest)).toEqual(
      'SELECT * FROM test_database.test_table'
    )
  })
})
