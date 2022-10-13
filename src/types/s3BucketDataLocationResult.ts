export interface S3BucketDataLocationResult {
  standardTierLocationsToCopy: string[]
  glacierTierLocationsToCopy: string[]
  dataAvailable: boolean
}
