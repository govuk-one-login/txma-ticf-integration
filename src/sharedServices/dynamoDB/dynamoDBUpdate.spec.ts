// import { ZENDESK_TICKET_ID } from '../../utils/tests/testConstants'
// import { incrementObjectFieldByOne } from './dynamoDBUpdate'

// const myFieldToUpdate = 'myFieldToUpdate'

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => {
    return { send: mockSend }
  })
}))
const mockSend = jest.fn()

describe('incrementObjectFieldByOne', () => {
  it('', async () => {
    // await incrementObjectFieldByOne(ZENDESK_TICKET_ID, myFieldToUpdate)
    // dynamoMock.commandCalls(UpdateItemCommand)
    // expect(dynamoMock).toHaveBeenCalledWith(mockUpdateParams)
  })
})
