import { isEmailInValidRecipientList } from './isEmailInValidRecipientList'
import { readS3DataToString } from '../../sharedServices/s3/readS3DataToString'
import { when } from 'jest-when'
import { TEST_VALID_EMAIL_RECIPIENTS_BUCKET } from '../../utils/tests/testConstants'
jest.mock('../../sharedServices/s3/readS3DataToString', () => ({
  readS3DataToString: jest.fn()
}))

const GIVEN_VALID_RECIPIENT = 'recipient1@somedomain.gov.uk'
const GIVEN_INVALID_RECIPIENT = 'someOtherRecipient@somedomain.gov.uk'
const GIVEN_EMAIL_RECIPIENT_LIST = `${GIVEN_VALID_RECIPIENT}\nrecipient2@somedomain.gov.uk`
describe('isEmailInValidRecipientList', () => {
  beforeEach(() => {
    when(readS3DataToString).mockResolvedValue(GIVEN_EMAIL_RECIPIENT_LIST)
  })

  it('should return true if the supplied email is in the given list', async () => {
    expect(await isEmailInValidRecipientList(GIVEN_VALID_RECIPIENT)).toEqual(
      true
    )
    expect(readS3DataToString).toHaveBeenCalledWith(
      TEST_VALID_EMAIL_RECIPIENTS_BUCKET,
      'valid-email-recipients.txt'
    )
  })

  it('should return false if the supplied email is not in the given list', async () => {
    expect(await isEmailInValidRecipientList(GIVEN_INVALID_RECIPIENT)).toEqual(
      false
    )
    expect(readS3DataToString).toHaveBeenCalledWith(
      TEST_VALID_EMAIL_RECIPIENTS_BUCKET,
      'valid-email-recipients.txt'
    )
  })
})
