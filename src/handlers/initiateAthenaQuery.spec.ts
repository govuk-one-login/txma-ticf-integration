// import { handler } from './initiateAthenaQuery'
// import { confirmAthenaTable } from '../services/athena/confirmAthenaTable'

jest.mock('../services/athena/confirmAthenaTable', () => ({
  confirmAthenaTable: jest.fn()
}))

describe('initiate athena query handler', () => {
  it('has a placeholder', async () => {
    expect(true).toBe(true)
  })
})
