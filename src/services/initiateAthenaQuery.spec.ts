// import { AthenaDataSourceResult } from '../types/athenaDataSourceResult'
// import { confirmAthenaDataSource } from './confirmAthenaDataSource'
// import { initiateAthenaQuery } from './initiateAthenaQuery'
// import { testDataRequest } from '../testUtils/testDataRequest'

// jest.mock('./confirmAthenaDataSource', () => ({
//   confirmAthenaDataSource: jest.fn()
// }))
// const mockConfirmAthenaDataSource = confirmAthenaDataSource as jest.Mock<
//   Promise<AthenaDataSourceResult>
// >

// describe('initiate Athena query', () => {
//   const givenDataSourceResult = (dataSourceAvailable: boolean) => {
//     mockConfirmAthenaDataSource.mockResolvedValue({
//       dataSourceAvailable
//     })
//   }

//   const givenNoDataSourceAvailable = () => {
//     givenDataSourceResult(false)
//   }

//   const givenDataSourceAvailable = () => {
//     givenDataSourceResult(true)
//   }

//   it('returns false if no Athena data source can be found', async () => {
//     givenNoDataSourceAvailable()
//     expect(await initiateAthenaQuery(testDataRequest)).toEqual({
//       success: false,
//       errorMessage: 'No data source found for request'
//     })
//     expect(mockConfirmAthenaDataSource).toHaveBeenCalled()
//   })

//   it('returns true if an Athena data source can be found', async () => {
//     givenDataSourceAvailable()
//     // TODO: when actual logic to kick off athena query is written, tests for this should go here
//     expect(await initiateAthenaQuery(testDataRequest)).toEqual({
//       success: true
//     })
//     expect(mockConfirmAthenaDataSource).toHaveBeenCalled()
//   })
// })
