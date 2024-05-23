import { listCurrentEmailRecipients } from './listCurrentEmailRecipients'
import { writeRecipientListToBucket } from './writeRecipientListToBucket'
import { when } from 'jest-when'
import { addEmailRecipient } from './addEmailRecipient'
jest.mock('./listCurrentEmailRecipients', () => ({
  listCurrentEmailRecipients: jest.fn()
}))

jest.mock('./writeRecipientListToBucket', () => ({
  writeRecipientListToBucket: jest.fn()
}))

describe('addEmailRecipient', () => {
  const testExistingEmail = 'myEmail1@example.com'
  const testNewEmail = 'myEmail3@example.com'
  const testEnvironment = 'myEnvironment'
  const currentRecipients = [testExistingEmail, 'myEmail2@example.com']
  beforeEach(() => {
    jest.resetAllMocks()
  })
  it('should add a new email if it does not exist in the current list', async () => {
    when(listCurrentEmailRecipients).mockResolvedValue(currentRecipients)
    await addEmailRecipient(testNewEmail, testEnvironment)
    expect(listCurrentEmailRecipients).toHaveBeenCalledWith(testEnvironment)

    const newRecipientList = currentRecipients.concat(testNewEmail)
    expect(writeRecipientListToBucket).toHaveBeenCalledWith(
      newRecipientList,
      testEnvironment
    )
  })

  it('should not try to add the email if it already exists in the current list', async () => {
    when(listCurrentEmailRecipients).mockResolvedValue(currentRecipients)
    await addEmailRecipient(testExistingEmail, testEnvironment)
    expect(listCurrentEmailRecipients).toHaveBeenCalledWith(testEnvironment)

    expect(writeRecipientListToBucket).not.toHaveBeenCalled()
  })
})
