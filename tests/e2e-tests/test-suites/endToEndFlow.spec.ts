import { approveZendeskTicket } from '../../shared-test-code/utils/zendesk/approveZendeskTicket'
import { createZendeskTicket } from '../../shared-test-code/utils/zendesk/createZendeskTicket'
import { downloadResultsFileAndParseData } from '../../shared-test-code/utils/queryResults/downloadAndParseResults'
import { pollNotifyApiForDownloadUrl } from '../../shared-test-code/utils/queryResults/getDownloadUrlFromNotifyApi'
import { deleteZendeskTicket } from '../../shared-test-code/utils/zendesk/deleteZendeskTicket'
import { getEnv } from '../../shared-test-code/utils/helpers'
import { generateZendeskTicketData } from '../../shared-test-code/utils/zendesk/generateZendeskTicketData'
import { testData } from '../constants/testData'
import { zendeskConstants } from '../../shared-test-code/constants/zendeskParameters'
import { setupAuditSourceTestData } from '../../shared-test-code/utils/aws/setupAuditSourceTestData'

const endToEndFlowRequestDataWithEventId = generateZendeskTicketData({
  identifier: 'event_id',
  eventIds: testData.eventId,
  customDataPath: testData.dataPath,
  recipientEmail: getEnv('ZENDESK_RECIPIENT_EMAIL'),
  recipientName: getEnv('ZENDESK_RECIPIENT_NAME')
})

const endToEndFlowRequestDataWithTwoDates = generateZendeskTicketData({
  identifier: 'event_id',
  eventIds: `${testData.eventId} ${testData.eventId2}`,
  datesList: `${testData.date} ${testData.date2}`,
  customDataPath: testData.dataPath,
  recipientEmail: getEnv('ZENDESK_RECIPIENT_EMAIL'),
  recipientName: getEnv('ZENDESK_RECIPIENT_NAME')
})

const endToEndFlowRequestDataWithUserId = generateZendeskTicketData({
  identifier: 'user_id',
  userIds: testData.userId,
  piiTypes: [
    `${zendeskConstants.piiTypesPrefix}passport_number`,
    `${zendeskConstants.piiTypesPrefix}passport_expiry_date`
  ]
})

const endToEndFlowRequestDataWithSessionId = generateZendeskTicketData({
  identifier: 'session_id',
  sessionIds: testData.sessionId
})

const endToEndFlowRequestDataWithJourneyId = generateZendeskTicketData({
  identifier: 'journey_id',
  journeyIds: testData.journeyId,
  piiTypes: [`${zendeskConstants.piiTypesPrefix}drivers_license`]
})

const endToEndFlowRequestDataNoMatch = generateZendeskTicketData({
  identifier: 'event_id',
  eventIds: 'zzzzzzzz-yyyy-aaaa-bbbb-cccccccccccc'
})

describe('Query results generated', () => {
  let zendeskId: string

  beforeEach(async () => {
    await setupAuditSourceTestData(
      testData.fileName,
      `firehose/${testData.prefix}/01`
    )
    await setupAuditSourceTestData(
      testData.fileName2,
      `firehose/${testData.prefix2}/01`
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

    const downloadUrl = await pollNotifyApiForDownloadUrl(zendeskId)
    const rows = await downloadResultsFileAndParseData(downloadUrl)

    expect(rows.length).toEqual(1)
    expect(rows[0].event_id).toEqual(testData.eventId)
    expect(rows[0].name0_nameparts0_value).toEqual(expectedFirstName)
    expect(rows[0].name0_nameparts1_value).toEqual(expectedLastName)
    expect(rows[0].birthdate0_value).toEqual(expectedBirthDate)
    expect(rows[0].address0_validfrom).toEqual(expectedAddressValidFromDate)
    expect(rows[0].address1_postalcode).toEqual(expectedPostalCode)
  })

  it('Query matching data with two dates', async () => {
    zendeskId = await createZendeskTicket(endToEndFlowRequestDataWithTwoDates)
    await approveZendeskTicket(zendeskId)

    const downloadUrl = await pollNotifyApiForDownloadUrl(zendeskId)
    const rows = await downloadResultsFileAndParseData(downloadUrl)

    expect(rows.length).toEqual(2)

    expect(rows.length).toEqual(2)
    const event1Data = rows.find((row) => row.event_id === testData.eventId)
    const event2Data = rows.find((row) => row.event_id === testData.eventId2)
    if (!event1Data || !event2Data) {
      throw new Error('Could not find data for one or more of the test events')
    }

    expect(event1Data.event_id).toEqual(testData.eventId)
    expect(event1Data.name0_nameparts0_value).toEqual(`"MICHELLE"`)
    expect(event1Data.name0_nameparts1_value).toEqual(`"KABIR"`)
    expect(event1Data.birthdate0_value).toEqual(`"1981-07-28"`)
    expect(event1Data.address0_validfrom).toEqual(`"2014-01-01"`)
    expect(event1Data.address1_postalcode).toEqual(`"EH2 5BJ"`)

    expect(event2Data.event_id).toEqual(testData.eventId2)
    expect(event2Data.name0_nameparts0_value).toEqual(`"MICHELLE2"`)
    expect(event2Data.name0_nameparts1_value).toEqual(`"KABIR2"`)
    expect(event2Data.birthdate0_value).toEqual(`"1981-07-29"`)
    expect(event2Data.address0_validfrom).toEqual(`"2015-01-01"`)
    expect(event2Data.address1_postalcode).toEqual(`"EH3 6BJ"`)
  })

  it('Query matching data with user id', async () => {
    const expectedPassportNumber = `"543543543"`
    const expectedPassportExpiryDate = `"2030-01-01"`

    zendeskId = await createZendeskTicket(endToEndFlowRequestDataWithUserId)
    await approveZendeskTicket(zendeskId)

    const downloadUrl = await pollNotifyApiForDownloadUrl(zendeskId)
    const rows = await downloadResultsFileAndParseData(downloadUrl)

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

    const downloadUrl = await pollNotifyApiForDownloadUrl(zendeskId)
    const rows = await downloadResultsFileAndParseData(downloadUrl)

    expect(rows.length).toEqual(1)
    expect.arrayContaining(expectedDriversLicense)
  })

  it('Query matching data with session id', async () => {
    const expectedBirthDate = `"1981-07-28"`

    zendeskId = await createZendeskTicket(endToEndFlowRequestDataWithSessionId)
    await approveZendeskTicket(zendeskId)

    const downloadUrl = await pollNotifyApiForDownloadUrl(zendeskId)
    const rows = await downloadResultsFileAndParseData(downloadUrl)

    expect(rows.length).toEqual(1)
    expect(rows[0].name).toBeDefined()
    expect(rows[0].addresses).toBeDefined()
    expect(rows[0].dob).toEqual(expectedBirthDate)
  })

  it('Query does not match data - Empty CSV file should be downloaded', async () => {
    zendeskId = await createZendeskTicket(endToEndFlowRequestDataNoMatch)
    await approveZendeskTicket(zendeskId)

    const downloadUrl = await pollNotifyApiForDownloadUrl(zendeskId)
    const rows = await downloadResultsFileAndParseData(downloadUrl)

    expect(rows.length).toEqual(0)
  })
})
