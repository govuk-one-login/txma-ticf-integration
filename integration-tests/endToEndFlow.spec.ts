import * as CSV from 'csv-string'
import {
  AUDIT_BUCKET_NAME,
  END_TO_END_TEST_DATE_PREFIX,
  END_TO_END_TEST_FILE_NAME
} from './constants/awsParameters'
import { waitForDownloadHash } from './utils/aws/waitForDownloadHash'
import { copyAuditDataFromTestDataBucket } from './utils/aws/s3CopyAuditDataFromTestDataBucket'
import { deleteAuditDataWithPrefix } from './utils/aws/s3DeleteAuditDataWithPrefix'
import { approveZendeskTicket } from './utils/zendesk/approveZendeskTicket'
import { createZendeskTicket } from './utils/zendesk/createZendeskTicket'
import {
  downloadResultsCSVFromLink,
  getSecureDownloadPageHTML,
  retrieveS3LinkFromHtml
} from './utils/secureDownload'
import {
  endToEndFlowRequestDataNoMatch,
  endToEndFlowRequestDataWithEventId,
  endToEndFlowRequestDataWithJourneyId,
  endToEndFlowRequestDataWithSessionId,
  endToEndFlowRequestDataWithUserId
} from './constants/requestData/endToEndFlowRequestData'
import { END_TO_END_TEST_EVENT_ID } from './constants/zendeskParameters'

describe('Query results generated', () => {
  jest.setTimeout(60000)

  beforeEach(async () => {
    await deleteAuditDataWithPrefix(
      AUDIT_BUCKET_NAME,
      `firehose/${END_TO_END_TEST_DATE_PREFIX}`
    )

    await copyAuditDataFromTestDataBucket(
      AUDIT_BUCKET_NAME,
      `firehose/${END_TO_END_TEST_DATE_PREFIX}/01/${END_TO_END_TEST_FILE_NAME}`,
      END_TO_END_TEST_FILE_NAME
    )
  })

  it('Query matches data - CSV file containing query results can be downloaded', async () => {
    const EXPECTED_ADDRESS_VALID_FROM_DATE = `"2014-01-01"`
    const EXPECTED_BIRTH_DATE = `"1981-07-28"`
    const EXPECTED_POSTALCODE = `"EH2 5BJ"`
    const EXPECTED_FIRSTNAME = `"MICHELLE"`
    const EXPECTED_LASTNAME = `"KABIR"`

    const zendeskId: string = await createZendeskTicket(
      endToEndFlowRequestDataWithEventId
    )
    await approveZendeskTicket(zendeskId)

    const rows = await waitForDownloadHashAndDownloadResults(zendeskId)

    expect(rows.length).toEqual(1)
    expect(rows[0].event_id).toEqual(END_TO_END_TEST_EVENT_ID)
    expect(rows[0].name).toBeDefined()
    expect(rows[0].name_nameparts_value).toEqual(EXPECTED_FIRSTNAME) //TODO: check against csv
    expect(rows[0].name_nameparts_value).toEqual(EXPECTED_LASTNAME) //TODO: check against csv
    expect(rows[0].birthdate_value).toEqual(EXPECTED_BIRTH_DATE)
    expect(rows[0].address_validfrom).toEqual(EXPECTED_ADDRESS_VALID_FROM_DATE)
    expect(rows[0].address_postalcode).toEqual(EXPECTED_POSTALCODE)
  })

  it('Query matching data with user id', async () => {
    const EXPECTED_PASSPORT_NUMBER = `"543543543"`
    const EXPECTED_PASSPORT_EXPIRY_DATE = `"2030-01-01"`

    const zendeskId: string = await createZendeskTicket(
      endToEndFlowRequestDataWithUserId
    )
    await approveZendeskTicket(zendeskId)

    const rows = await waitForDownloadHashAndDownloadResults(zendeskId)

    expect(rows.length).toEqual(1)
    expect(rows[0].passport_documentnumber).toEqual(EXPECTED_PASSPORT_NUMBER)
    expect(rows[0].passport_expirydate).toEqual(EXPECTED_PASSPORT_EXPIRY_DATE)
  })

  it('Query matching data with journey id', async () => {
    const EXPECTED_DRIVERS_LICENSE_NUMBER = `"BINNS902235OW9TF"`

    const zendeskId: string = await createZendeskTicket(
      endToEndFlowRequestDataWithJourneyId
    )
    await approveZendeskTicket(zendeskId)

    const rows = await waitForDownloadHashAndDownloadResults(zendeskId)

    expect(rows.length).toEqual(1)
    expect(rows[0].drivingpermit).toEqual(EXPECTED_DRIVERS_LICENSE_NUMBER) // TODO: check against actual results
  })

  it('Query matching data with session id', async () => {
    const EXPECTED_BIRTH_DATE = `"1981-07-28"`

    const zendeskId: string = await createZendeskTicket(
      endToEndFlowRequestDataWithSessionId
    )
    await approveZendeskTicket(zendeskId)

    const rows = await waitForDownloadHashAndDownloadResults(zendeskId)

    expect(rows.length).toEqual(1)
    expect(rows[0].name).toBeDefined()
    expect(rows[0].address).toBeDefined() //TODO: check format against actual result
    expect(rows[0].birthdate_value).toEqual(EXPECTED_BIRTH_DATE) //TODO: check what dob is called when in pii type
  })

  it('Query does not match data - Empty CSV file should be downloaded', async () => {
    const zendeskId: string = await createZendeskTicket(
      endToEndFlowRequestDataNoMatch
    )
    await approveZendeskTicket(zendeskId)
    const downloadHash = await waitForDownloadHash(zendeskId)

    const secureDownloadPageHTML = await getSecureDownloadPageHTML(downloadHash)

    console.log(secureDownloadPageHTML)
    expect(secureDownloadPageHTML).toBeDefined()

    const resultsFileS3Link = retrieveS3LinkFromHtml(secureDownloadPageHTML)
    expect(resultsFileS3Link.startsWith('https')).toBeTrue

    const csvData = await downloadResultsCSVFromLink(resultsFileS3Link)
    console.log(csvData)
    const rows = CSV.parse(csvData, { output: 'objects' })
    console.log(rows)
    expect(rows.length).toEqual(0)
  })

  async function waitForDownloadHashAndDownloadResults(zendeskId: string) {
    const downloadHash = await waitForDownloadHash(zendeskId)

    const secureDownloadPageHTML = await getSecureDownloadPageHTML(downloadHash)
    expect(secureDownloadPageHTML).toBeDefined()

    const resultsFileS3Link = retrieveS3LinkFromHtml(secureDownloadPageHTML)
    expect(resultsFileS3Link.startsWith('https')).toBeTrue

    const csvData = await downloadResultsCSVFromLink(resultsFileS3Link)
    console.log(csvData)

    const rows = CSV.parse(csvData, { output: 'objects' })
    console.log(rows)
    return rows
  }
})
