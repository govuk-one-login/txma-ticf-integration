import { listCurrentEmailRecipients } from './listCurrentEmailRecipients'
import { writeRecipientListToBucket } from './writeRecipientListToBucket'
import { when } from 'jest-when'
import { removeEmailRecipient } from './removeEmailRecipient'
jest.mock('./listCurrentEmailRecipients', () => ({
  listCurrentEmailRecipients: jest.fn()
}))

jest.mock('./writeRecipientListToBucket', () => ({
  writeRecipientListToBucket: jest.fn()
}))

describe('removeEmailRecipient', () => {
  const testExistingEmail = 'myEmail1@test.gov.uk'
  const testExistingEmail2 = 'myEmail2@test.gov.uk'
  const testEnvironment = 'myEnvironment'
  const testEmailToRemove = 'myEmailToRemove@test.gov.uk'
  const currentRecipients = [
    testExistingEmail,
    testExistingEmail2,
    testEmailToRemove
  ]

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should remove an email if it exists on the current list', async () => {
    when(listCurrentEmailRecipients).mockResolvedValue(currentRecipients)

    await removeEmailRecipient(testEmailToRemove, testEnvironment)

    expect(listCurrentEmailRecipients).toHaveBeenCalledWith(testEnvironment)

    const newRecipientList = [testExistingEmail, testExistingEmail2]
    expect(writeRecipientListToBucket).toHaveBeenCalledWith(
      newRecipientList,
      testEnvironment
    )
  })

  it('should not try to remove the email if it does not exist in the current list', async () => {
    when(listCurrentEmailRecipients).mockResolvedValue(currentRecipients)

    await removeEmailRecipient('someOtherEmail@test.gov.uk', testEnvironment)

    expect(listCurrentEmailRecipients).toHaveBeenCalledWith(testEnvironment)

    expect(writeRecipientListToBucket).not.toHaveBeenCalled()
  })
})
