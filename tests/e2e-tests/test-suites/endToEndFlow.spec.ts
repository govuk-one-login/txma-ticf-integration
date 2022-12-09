import { copyAuditDataFromTestDataBucket } from '../../shared-test-code/utils/aws/s3CopyAuditDataFromTestDataBucket'
import { approveZendeskTicket } from '../../shared-test-code/utils/zendesk/approveZendeskTicket'
import { createZendeskTicket } from '../../shared-test-code/utils/zendesk/createZendeskTicket'
import { downloadResultsFileAndParseData } from '../../shared-test-code/utils/queryResults/downloadAndParseResults'
import { deleteZendeskTicket } from '../../shared-test-code/utils/zendesk/deleteZendeskTicket'
import { getEnv } from '../../shared-test-code/utils/helpers'
import { generateZendeskTicketData } from '../../shared-test-code/utils/zendesk/generateZendeskTicketData'
import { endToEndTestData } from '../constants/testData'

const endToEndFlowRequestDataWithEventId = generateZendeskTicketData({
  identifier: 'event_id',
  eventIds: endToEndTestData.eventId,
  requestDate: endToEndTestData.date,
  customDataPath: endToEndTestData.dataPath,
  recipientEmail: getEnv('ZENDESK_RECIPIENT_EMAIL'),
  recipientName: getEnv('ZENDESK_RECIPIENT_NAME')
})

const endToEndFlowRequestDataWithUserId = generateZendeskTicketData({
  identifier: 'user_id',
  userIds: endToEndTestData.userId,
  piiTypes: ['passport_number', 'passport_expiry_date']
})

const endToEndFlowRequestDataWithSessionId = generateZendeskTicketData({
  identifier: 'session_id',
  sessionIds: endToEndTestData.sessionId
})

const endToEndFlowRequestDataWithJourneyId = generateZendeskTicketData({
  identifier: 'journey_id',
  journeyIds: endToEndTestData.journeyId,
  piiTypes: ['drivers_license']
})

const endToEndFlowRequestDataNoMatch = generateZendeskTicketData({
  identifier: 'event_id',
  eventIds: 'zzzzzzzz-yyyy-aaaa-bbbb-cccccccccccc'
})

describe('Query results generated', () => {
  let zendeskId: string

  beforeEach(async () => {
    await copyAuditDataFromTestDataBucket(
      getEnv('AUDIT_BUCKET_NAME'),
      `firehose/${endToEndTestData.prefix}/01/${endToEndTestData.fileName}`,
      endToEndTestData.fileName
    )
  })

  afterEach(async () => {
    await deleteZendeskTicket(zendeskId)
  })

  it('Query matching data with event id and data paths', async () => {
    const expectedAddressValidFromDate = `"2014-01-01"`
    const expectedBirthDate = `"1981-07-28"`
    const expectedPostalCode = `"EH2 5BJ"`
    const expectedFirstName = `"MICHELLE"`
    const expectedLastName = `"KABIR"`

    zendeskId = await createZendeskTicket(endToEndFlowRequestDataWithEventId)
    await approveZendeskTicket(zendeskId)

    const rows = await downloadResultsFileAndParseData(zendeskId)

    expect(rows.length).toEqual(1)
    expect(rows[0].event_id).toEqual(endToEndTestData.eventId)
    expect(rows[0].name0_nameparts0_value).toEqual(expectedFirstName)
    expect(rows[0].name0_nameparts1_value).toEqual(expectedLastName)
    expect(rows[0].birthdate0_value).toEqual(expectedBirthDate)
    expect(rows[0].address0_validfrom).toEqual(expectedAddressValidFromDate)
    expect(rows[0].address1_postalcode).toEqual(expectedPostalCode)
  })

  it('Query matching data with user id', async () => {
    const expectedPassportNumber = `"543543543"`
    const expectedPassportExpiryDate = `"2030-01-01"`

    zendeskId = await createZendeskTicket(endToEndFlowRequestDataWithUserId)
    await approveZendeskTicket(zendeskId)

    const rows = await downloadResultsFileAndParseData(zendeskId)
    expect(rows.length).toEqual(1)
    expect(rows[0].passport_number).toEqual(expectedPassportNumber)
    expect(rows[0].passport_expiry_date).toEqual(expectedPassportExpiryDate)
  })

  it('Query matching data with journey id', async () => {
    const expectedDriversLicense = [
      {
        expirydate: '2024-06-19',
        issuenumber: '96',
        personalnumber: 'BINNS902235OW9TF',
        issuedby: 'DVLA',
        issuedate: '2014-06-20'
      }
    ]

    zendeskId = await createZendeskTicket(endToEndFlowRequestDataWithJourneyId)
    await approveZendeskTicket(zendeskId)

    const rows = await downloadResultsFileAndParseData(zendeskId)
    expect(rows.length).toEqual(1)
    expect.arrayContaining(expectedDriversLicense)
  })

  it('Query matching data with session id', async () => {
    const expectedBirthDate = `"1981-07-28"`

    zendeskId = await createZendeskTicket(endToEndFlowRequestDataWithSessionId)
    await approveZendeskTicket(zendeskId)

    const rows = await downloadResultsFileAndParseData(zendeskId)

    expect(rows.length).toEqual(1)
    expect(rows[0].name).toBeDefined()
    expect(rows[0].addresses).toBeDefined()
    expect(rows[0].dob).toEqual(expectedBirthDate)
  })

  it('Query does not match data - Empty CSV file should be downloaded', async () => {
    zendeskId = await createZendeskTicket(endToEndFlowRequestDataNoMatch)
    await approveZendeskTicket(zendeskId)

    const rows = await downloadResultsFileAndParseData(zendeskId)
    expect(rows.length).toEqual(0)
  })
})
