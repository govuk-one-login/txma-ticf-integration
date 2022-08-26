// import { DataRequestParams } from '../types/dataRequestParams'
// import { InitiateAthenaQueryResult } from '../types/initiateAthenaQueryResult'
// import { confirmAthenaDataSource } from './confirmAthenaDataSource'

// export const initiateAthenaQuery = async (
//   dataRequestParams: DataRequestParams
// ): Promise<InitiateAthenaQueryResult> => {
//   const dataSource = await confirmAthenaDataSource()
//   if (!dataSource.dataSourceAvailable) {
//     return Promise.resolve({
//       success: false,
//       errorMessage: 'No data source found for request'
//     })
//   }
//   // TODO: add code here to initiate Athena Query jobs
//   console.log(dataRequestParams)

//   return Promise.resolve({ success: true })
// }
