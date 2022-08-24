export interface S3BucketDataLocationResult {
  standardTierLocations?: string[]
  glacierTierLocations?: string[]
  dataAvailable: boolean
}
