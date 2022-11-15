import * as CSV from 'csv-string'
import {
  AUDIT_BUCKET_NAME,
  END_TO_END_TEST_DATE_PREFIX,
  END_TO_END_TEST_EVENT_ID,
  END_TO_END_TEST_FILE_NAME
} from './constants/awsParameters'
import {
  endToEndTestRequestDataNoMatch,
  endToEndTestRequestDataWithMatch
} from './constants/requestData'
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
import { waitForDownloadUrlFromNotifyEmail } from './utils/notify/getDownloadUrlFromNotifyEmail'

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

  it.only('Query matches data - CSV file containing query results can be downloaded', async () => {
    const EXPECTED_ADDRESS_VALID_FROM_DATE = `"2014-01-01"`
    const EXPECTED_BIRTH_DATE = `"1981-07-28"`
    const EXPECTED_POSTALCODE = `"AB10 6QW"`

    const zendeskId: string = await createZendeskTicket(
      endToEndTestRequestDataWithMatch
    )
    // await approveZendeskTicket(zendeskId)

    // const downloadHash = await waitForDownloadHash(zendeskId)

    // const secureDownloadPageHTML = await getSecureDownloadPageHTML(downloadHash)

    // expect(secureDownloadPageHTML).toBeDefined()

    // const resultsFileS3Link = retrieveS3LinkFromHtml(secureDownloadPageHTML)

    const resultsFileS3Link = await waitForDownloadUrlFromNotifyEmail(zendeskId)

    expect(resultsFileS3Link.startsWith('https')).toBeTrue

    const csvData = await downloadResultsCSVFromLink(resultsFileS3Link)
    console.log(csvData)

    const rows = CSV.parse(csvData, { output: 'objects' })
    console.log(rows)

    expect(rows.length).toEqual(1)
    expect(rows[0].event_id).toEqual(END_TO_END_TEST_EVENT_ID)
    expect(rows[0].address_postalcode).toEqual(EXPECTED_POSTALCODE)
    expect(rows[0].address_validfrom).toEqual(EXPECTED_ADDRESS_VALID_FROM_DATE)
    expect(rows[0].birthdate_value).toEqual(EXPECTED_BIRTH_DATE)
    expect(rows[0].name).toBeDefined()
  })

  it('Query does not match data - Empty CSV file should be downloaded', async () => {
    const zendeskId: string = await createZendeskTicket(
      endToEndTestRequestDataNoMatch
    )
    await approveZendeskTicket(zendeskId)
    const downloadHash = await waitForDownloadHash(zendeskId)

    const secureDownloadPageHTML = await getSecureDownloadPageHTML(downloadHash)

    expect(secureDownloadPageHTML).toBeDefined()

    const resultsFileS3Link = retrieveS3LinkFromHtml(secureDownloadPageHTML)
    expect(resultsFileS3Link.startsWith('https')).toBeTrue

    const csvData = await downloadResultsCSVFromLink(resultsFileS3Link)
    console.log(csvData)
    const rows = CSV.parse(csvData, { output: 'objects' })
    console.log(rows)
    expect(rows.length).toEqual(0)
  })
})
