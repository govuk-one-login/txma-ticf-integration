import { handler } from './initiateAthenaQuery'
import { confirmAthenaTable } from '../services/athena/confirmAthenaTable'
import { ConfirmAthenaTableResult } from '../types/confirmAthenaTableResult'
import { testAthenaQueryEvent } from '../utils/tests/events/initiateAthenaQueryEvent'
import { updateZendeskTicketById } from '../services/updateZendeskTicket'

jest.mock('../services/athena/confirmAthenaTable', () => ({
  confirmAthenaTable: jest.fn()
}))
jest.mock('../services/updateZendeskTicket', () => ({
  updateZendeskTicketById: jest.fn()
}))

const mockConfirmAthenaTable = confirmAthenaTable as jest.Mock<
  Promise<ConfirmAthenaTableResult>
>
const mockUpdateZendeskTicket = updateZendeskTicketById as jest.Mock

describe('initiate athena query handler', () => {
  beforeEach(() => {
    mockConfirmAthenaTable.mockReset()
  })

  // it('confirms whether the athena data source exists', async () => {
  //   mockConfirmAthenaTable.mockResolvedValue({
  //     tableAvailable: true,
  //     message: 'test message'
  //   })

  //   await handler(testAthenaQueryEvent)
  //   expect(mockConfirmAthenaTable).toHaveBeenCalled()
  // })

  it('updates zendesk and throws an error if there is no athena data source', async () => {
    mockConfirmAthenaTable.mockResolvedValue({
      tableAvailable: false,
      message: 'test error message'
    })
    await expect(handler(testAthenaQueryEvent)).rejects.toThrow(
      'test error message'
    )
    expect(mockConfirmAthenaTable).toHaveBeenCalled()
    expect(mockUpdateZendeskTicket).toHaveBeenCalled()
  })

  it('throws an error if there is no data in the SQS Event', async () => {
    expect(handler({ Records: [] })).rejects.toThrow(
      'No data in Athena Query event'
    )
    expect(mockConfirmAthenaTable).not.toHaveBeenCalled()
  })
})
