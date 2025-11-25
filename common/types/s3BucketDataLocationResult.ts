export interface S3BucketDataLocationResult {
  standardTierLocationsToCopy: string[]
  glacierIRTierLocationsToCopy: string[]
  glacierTierLocationsToCopy: string[]
  dataAvailable: boolean
}
