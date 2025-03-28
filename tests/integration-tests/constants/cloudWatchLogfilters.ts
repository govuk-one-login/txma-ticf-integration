export const cloudwatchLogFilters: CloudwatchLogFiltersConstants = {
  athenaEventReceived: 'Handling Athena Query event',
  athenaInvokeError: 'Cannot find database entry for zendesk ticket',
  athenaQueryInitiated: 'Athena query execution initiated',
  athenaQueryQueued: 'Sent message to initiate Athena query queue',
  athenaSqlGenerated: 'Athena SQL generated',
  copyComplete: 'Restore/copy process complete.',
  copyStarted: 'Started S3 copy job',
  decryptStarted: 'Started data decrypt batch job',
  dataSentToQueue: 'Sent data transfer queue message',
  glacierTierCopy:
    'Number of standard tier files to copy was 0, glacier tier files to copy was 1',
  nothingToCopyMessage:
    'Number of standard tier files to copy was 0, glacier tier files to copy was 0',
  mixedTierCopy:
    'Number of standard tier files to copy was 1, glacier tier files to copy was 1',
  restoreStarted: 'Started Glacier restore',
  standardTierCopy:
    'Number of standard tier files to copy was 1, glacier tier files to copy was 0',
  sqsEventReceived: 'Handling data request SQS event',
  webhookInvalid: 'Zendesk request was invalid',
  webhookReceived: 'received Zendesk webhook',
  zendeskRequestInvalid: 'Zendesk request was invalid',
  allDataAvailableQueuingAthenaQuery:
    'All data available, queuing Athena query',
  zendeskId: 'zendeskId'
}

interface CloudwatchLogFiltersConstants {
  readonly athenaEventReceived: string
  readonly athenaInvokeError: string
  readonly athenaQueryInitiated: string
  readonly athenaQueryQueued: string
  readonly athenaSqlGenerated: string
  readonly copyStarted: string
  readonly decryptStarted: string
  readonly copyComplete: string
  readonly dataSentToQueue: string
  readonly glacierTierCopy: string
  readonly nothingToCopyMessage: string
  readonly mixedTierCopy: string
  readonly restoreStarted: string
  readonly standardTierCopy: string
  readonly sqsEventReceived: string
  readonly webhookInvalid: string
  readonly webhookReceived: string
  readonly zendeskRequestInvalid: string
  readonly allDataAvailableQueuingAthenaQuery: string
  readonly zendeskId: string
}
