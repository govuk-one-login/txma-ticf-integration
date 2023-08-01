export const getBucketFileName = (athenaQueryId: string): string =>
  `${athenaQueryId}.csv`
