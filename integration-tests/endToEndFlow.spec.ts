import axios from 'axios'
import { parse } from 'node-html-parser'
import {
  AUDIT_BUCKET_NAME,
  END_TO_END_TEST_DATE_PREFIX,
  END_TO_END_TEST_FILE_NAME
} from './constants/awsParameters'
import { endToEndTestRequestData } from './constants/requestData'
import { retrieveSecureDownloadDbRecord } from './utils/aws/retrieveSecureDownloadDbRecord'
import { copyAuditDataFromTestDataBucket } from './utils/aws/s3CopyAuditDataFromTestDataBucket'
import { deleteAuditDataWithPrefix } from './utils/aws/s3DeleteAuditDataWithPrefix'
import { getEnv, pause } from './utils/helpers'
import { approveZendeskTicket } from './utils/zendesk/approveZendeskTicket'
import { createZendeskTicket } from './utils/zendesk/createZendeskTicket'

describe('Query results generated', () => {
  jest.setTimeout(60000)

  const getSecureDownloadPageHTML = async (
    downloadHash: string
  ): Promise<string> => {
    try {
      const response = await axios({
        url: `${getEnv('QUERY_RESULTS_SECURE_DOWNLOAD_URL')}/${downloadHash}`,
        method: 'POST'
      })
      return response.data
    } catch (error) {
      console.log(error)
      throw 'Could not load secure download page'
    }
  }

  const retrieveS3LinkFromHtml = (htmlBody: string): string => {
    const htmlRoot = parse(htmlBody)
    const metaTag = htmlRoot.querySelector('meta[http-equiv="refresh"]')
    const contentAttribute = metaTag?.attributes['content'] as string
    expect(contentAttribute).toBeDefined()

    const urlMatch = contentAttribute.match(/url=(.*)/)
    const url = urlMatch ? urlMatch[1] : undefined
    expect(url).toBeDefined()
    console.log('S3 URL: ' + url)
    return url as string
  }

  const downloadResultsCSVFromLink = async (
    s3Link: string
  ): Promise<string> => {
    try {
      const response = await axios({ url: s3Link, method: 'GET' })
      return response.data
    } catch (error) {
      throw 'Error downloading results csv from S3 link'
    }
  }

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

  it('Fraud Site table should be populated after query completes successfully', async () => {
    const zendeskId: string = await createZendeskTicket(endToEndTestRequestData)
    await approveZendeskTicket(zendeskId)

    let downloadHash = await retrieveSecureDownloadDbRecord(zendeskId)
    const maxAttempts = 30
    let attempts = 0
    while (!downloadHash && attempts < maxAttempts) {
      attempts++
      await pause(2000)
      downloadHash = await retrieveSecureDownloadDbRecord(zendeskId)
    }

    if (attempts == maxAttempts) {
      throw Error(
        'Download hash not populated within reasonable time. Please check logs to ensure that data retrieval and query execution were successful'
      )
    }
    console.log(`DOWNLOAD HASH: ${downloadHash}`)
    expect(downloadHash).toBeDefined()

    let secureDownloadPageHTML = ''
    if (downloadHash) {
      secureDownloadPageHTML = await getSecureDownloadPageHTML(downloadHash)
    }

    console.log(secureDownloadPageHTML)
    expect(secureDownloadPageHTML).toBeDefined()

    const resultsFileS3Link = retrieveS3LinkFromHtml(secureDownloadPageHTML)
    expect(resultsFileS3Link.startsWith('https')).toBeTrue
    const csvData = downloadResultsCSVFromLink(resultsFileS3Link)
    console.log(csvData)
  })
})
