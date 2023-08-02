import { getBucketFileName } from './getBucketFileName'

const TEST_ATHENA_QUERY_ID = '46e34211-f930-4e15-a9fb-802f2ae77052'

describe('getBucketFileName function tests', () => {
  it('constructs the correct filename based on a provided Athena query Id', () => {
    const fileName = getBucketFileName(TEST_ATHENA_QUERY_ID)
    expect(fileName).toBe(`${TEST_ATHENA_QUERY_ID}.csv`)
  })
})
