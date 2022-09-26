import { createQuerySql } from './createQuerySql'

describe('create Query SQL', () => {
  test('returns a string', () => {
    expect(createQuerySql({ Item: {}, $metadata: {} })).toEqual('SQL string')
  })
})
