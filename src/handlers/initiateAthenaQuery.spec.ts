import { handler } from './initiateAthenaQuery'
import { confirmAthenaTable } from '../services/athena/confirmAthenaTable'
import { ConfirmAthenaTableResult } from '../types/confirmAthenaTableResult'
import { testAthenaQueryEvent } from '../utils/tests/events/initiateAthenaQueryEvent'

jest.mock('../services/athena/confirmAthenaTable', () => ({
  confirmAthenaTable: jest.fn()
}))

const confirmAthenaTableMock = confirmAthenaTable as jest.Mock<
  Promise<ConfirmAthenaTableResult>
>

describe('initiate athena query handler', () => {
  beforeEach(() => {
    confirmAthenaTableMock.mockReset()
  })

  it('confirms whether the athena data source exists', async () => {
    confirmAthenaTableMock.mockResolvedValue({
      tableAvailable: true,
      message: 'test message'
    })

    await handler(testAthenaQueryEvent)
    expect(confirmAthenaTableMock).toHaveBeenCalled()
  })

  it('throws an error if there is no data in the SQS Event', async () => {
    expect(handler({ Records: [] })).rejects.toThrow(
      'No data in Athena Query event'
    )
    expect(confirmAthenaTableMock).not.toHaveBeenCalled()
  })
})
