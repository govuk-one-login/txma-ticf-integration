// import { DataRequestParams } from '../types/dataRequestParams'
// import {
//   AthenaClient,
//   GetTableMetadataCommand,
//   GetTableMetadataCommandInput
// } from '@aws-sdk/client-athena'
// import { AthenaDataSourceResult } from '../types/athenaDataSourceResult'

// const region = process.env.AWS_REGION

// export const confirmAthenaDataSource =
//   async (): Promise<AthenaDataSourceResult> => {
//     console.log('Looking for Athena data source')
//     // TODO: fill in logic to search Athena for data source
//     // For now we keep things in such a way that the webhook will still return a successful result
//     const client = new AthenaClient({ region: region })
//     const command: GetTableMetadataCommandInput = {
//       CatalogName: '',
//       DatabaseName: '',
//       TableName: ''
//     }
//     const response = await client.send(new GetTableMetadataCommand(command))

//     return Promise.resolve({
//       dataSourceAvailable: true
//     })
//   }
